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

import { HttpException, HttpStatus, Injectable } from '@nestjs/common'
import fetch from 'node-fetch'
import qs from 'query-string'

import { Config } from '@perfsee/platform-server/config'

import { OAuthProvider } from './provider'

interface AuthTokenResponse {
  access_token: string
  scope: string
  token_type: string
}

export interface UserInfo {
  login: string
  email: string
  avatar_url: string
  name: string
}
//       userInfoUri: 'https://api.github.com/user',
// accessTokenUri: 'https://github.com/login/oauth/access_token',
@Injectable()
export class GithubOAuthProvider extends OAuthProvider {
  constructor(protected readonly globalConfig: Config) {
    super()
  }

  get config() {
    return this.globalConfig.auth.oauthProviders.github!
  }

  getAuthUrl(state?: string) {
    return `${this.config.authorizationUri || 'https://github.com/login/oauth/authorize'}?${qs.stringify(
      {
        client_id: this.config.clientId,
        redirect_uri: this.redirectUri,
        state: state,
        ...this.config.args,
      },
      { encode: true },
    )}`
  }

  async getToken(code: string) {
    try {
      const response = await fetch(this.config.accessTokenUri || 'https://github.com/login/oauth/access_token', {
        method: 'POST',
        body: qs.stringify({
          code,
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          redirect_uri: this.redirectUri,
        }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      })

      if (response.ok) {
        return ((await response.json()) as AuthTokenResponse).access_token
      } else {
        throw new Error(
          `Server responded with non-success code ${response.status}, ${JSON.stringify(await response.json())}`,
        )
      }
    } catch (e) {
      throw new HttpException(`Failed to get access_token, err: ${(e as Error).message}`, HttpStatus.BAD_REQUEST)
    }
  }

  async getUser(token: string) {
    try {
      const response = await fetch(this.config.userInfoUri || 'https://api.github.com/user', {
        method: 'GET',
        headers: {
          Authorization: `token ${token}`,
        },
      })
      if (response.ok) {
        const user = (await response.json()) as UserInfo

        return {
          username: user.login,
          avatarUrl: user.avatar_url,
          email: user.email,
        }
      } else {
        throw new Error(`Server responded with non-success code ${response.status} ${await response.text()}`)
      }
    } catch (e) {
      throw new HttpException(`Failed to get user information, err: ${(e as Error).stack}`, HttpStatus.BAD_REQUEST)
    }
  }
}
