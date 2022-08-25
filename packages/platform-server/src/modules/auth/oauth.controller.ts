/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Controller, Get, HttpException, HttpStatus, Query, Req, Res } from '@nestjs/common'
import { Response, Request } from 'express'
import qs from 'query-string'

import { User } from '@perfsee/platform-server/db'
import { UrlService } from '@perfsee/platform-server/helpers'
import { ExternalAccount } from '@perfsee/shared'
import { staticPath } from '@perfsee/shared/routes'

import { UserService } from '../user'

import { AuthService } from './auth.service'
import { OAuthProviderFactory, OAuthProvider, ExternalAccountUser } from './providers'

@Controller('/oauth2')
export class OAuth2Controller {
  constructor(
    private readonly auth: AuthService,
    private readonly user: UserService,
    private readonly providerFactory: OAuthProviderFactory,
    private readonly url: UrlService,
  ) {}

  @Get('/login')
  async login(@Res() res: Response, @Query('provider') providerName: string, @Query('returnUrl') returnUrl: string) {
    const provider = this.getProvider(providerName)

    if (!provider) {
      throw new HttpException('Invalid provider', HttpStatus.BAD_REQUEST)
    }

    return res.redirect(
      provider.getAuthUrl(
        JSON.stringify({
          state: await this.auth.saveOauthState({
            platform: 'perfsee',
            returnUrl,
            provider: providerName,
          }),
        }),
      ),
    )
  }

  @Get('/authorize')
  async authorize(
    @Req() req: Request,
    @Res() res: Response,
    @Query('clientId') clientId: string,
    @Query('returnUrl') returnUrl: string,
  ) {
    if (clientId !== 'perfsee-vscode') {
      throw new HttpException('Invalid client ID', HttpStatus.UNAUTHORIZED)
    }

    if (!returnUrl.startsWith('vscode://perfsee.perfsee-vscode/did-authenticate')) {
      throw new HttpException('Invalid return Url', HttpStatus.UNAUTHORIZED)
    }

    const user = await this.auth.getUserFromRequest(req)

    if (!user) {
      // redirect to login
      return res.redirect(`${staticPath.login}?${qs.stringify({ returnUrl: req.url })}`)
    } else if (user.isApp) {
      throw new HttpException('Invalid user', HttpStatus.UNAUTHORIZED)
    } else {
      // logged
      const token = await this.auth.generateToken(user, clientId, true)
      const urlWithToken = new URL(returnUrl)
      urlWithToken.searchParams.append('token', token)
      return res.redirect(urlWithToken.toString())
    }
  }

  @Get('/callback')
  async callback(
    @Req() req: Request,
    @Res() res: Response,
    @Query('code') code?: string,
    @Query('state') stateStr?: string,
  ) {
    if (!code) {
      throw new HttpException('Missing query parameter `code`', HttpStatus.BAD_REQUEST)
    }

    let state: Record<string, any> | null = {}
    try {
      if (stateStr) {
        state = JSON.parse(stateStr)
      }
    } catch (e) {
      throw new HttpException('invalid callback state parameter', HttpStatus.BAD_REQUEST)
    }

    if (!state || !state.state) {
      throw new HttpException('Invalid callback state parameter', HttpStatus.BAD_REQUEST)
    }

    state = await this.auth.getOauthState(state.state)

    if (!state) {
      throw new HttpException('Oauth state expired, please try again.', HttpStatus.BAD_REQUEST)
    }

    if (!state.provider) {
      throw new HttpException('Missing callback state parameter `provider`', HttpStatus.BAD_REQUEST)
    }

    const provider = this.getProvider(state.provider)

    if (!provider) {
      throw new HttpException('Invalid provider', HttpStatus.BAD_REQUEST)
    }

    const user = await this.auth.getUserFromRequest(req)
    const token = await provider.getToken(code)
    const externAccount = await provider.getUser(token)

    try {
      if (!user) {
        // if user not found, login
        const user = await this.loginFromOauth(state.provider, externAccount, token)
        req.session.user = user
      } else {
        // if user is found, connect the account to this user
        await this.connectAccountFromOauth(user, state.provider, externAccount, token)
      }
    } catch (e: any) {
      return res.redirect(this.errorPage(e.message, { returnUrl: state.returnUrl }))
    }

    this.url.safeRedirect(res, state.returnUrl || staticPath.home)
  }

  private async loginFromOauth(provider: ExternalAccount, externAccount: ExternalAccountUser, token: string) {
    const connectedUser = await this.user.findUserByExternUsername(provider, externAccount.username)
    if (connectedUser) {
      if (!connectedUser.isFulfilled) {
        // for some old data, isFulfilled is not set, but has connected accounts
        await this.user.updateUnfulfilledUser(connectedUser)
      }
      return connectedUser
    }

    // find registered user by email
    let user = await this.user.findUserByEmail(externAccount.email)

    if (user) {
      if (!user.isFulfilled) {
        // if user exists but is not registered, register the user, update information and connect the account
        // TODO: handling duplicate username
        await this.user.updateUnfulfilledUser(user, externAccount)
        await this.user.connectAccount(user, provider, externAccount.username, token)
      } else {
        // if user exists and is registered, check if the account is connected to the user
        const connectedAccount = await this.user.getUserConnectedAccount(user, provider)
        if (!connectedAccount || connectedAccount.externUsername !== externAccount.username) {
          // error when user is already registered but not connected to the external account
          throw new Error('EMAIL_ALREADY_EXISTS')
        }
      }
    } else {
      // user not found, create new user
      // TODO: handling duplicate username
      user = await this.user.createUser(externAccount)
      await this.user.connectAccount(user, provider, externAccount.username, token)
    }

    return user
  }

  private async connectAccountFromOauth(
    user: User,
    provider: ExternalAccount,
    externAccount: ExternalAccountUser,
    token: string,
  ) {
    const connectedUser = await this.user.findUserByExternUsername(provider, externAccount.username)
    if (connectedUser) {
      if (connectedUser.id !== user.id) {
        throw new Error('EXTERN_USERNAME_TAKEN')
      }
    } else {
      await this.user.connectAccount(user, provider, externAccount.username, token)
    }
  }

  private getProvider(provider: string): OAuthProvider | undefined {
    return this.providerFactory.getProvider(provider as ExternalAccount)
  }

  private errorPage(code: string, other: any = {}) {
    return qs.stringifyUrl({ url: staticPath.login, query: { statusCode: code, ...other } })
  }
}
