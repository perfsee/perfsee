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

import {
  Controller,
  Get,
  Query,
  Res,
  HttpException,
  HttpStatus,
  Session,
  Req,
  Body,
  Post,
  OnApplicationBootstrap,
} from '@nestjs/common'
import { Response, Request } from 'express'
import qs from 'query-string'

import emailTemplates from '@perfsee/email-templates'
import { Config } from '@perfsee/platform-server/config'
import { CryptoService, UrlService } from '@perfsee/platform-server/helpers'
import { pathFactory, staticPath } from '@perfsee/shared/routes'

import { EmailService } from '../email'
import { compileEmailTemplate } from '../notification/provider/email/utils'
import { UserService } from '../user'

import { AuthService } from './auth.service'
import { PerfseeSession } from './type'

class LoginBody {
  email!: string
  password!: string
}

class RegisterBody {
  email!: string
  password!: string
  username!: string
  firstName!: string
  lastName!: string
}

class ResetPasswordBody {
  resetToken!: string
  password!: string
  confirmPassword!: string
}

const passwordResetEmailTemplate = compileEmailTemplate(emailTemplates.message)

@Controller('/auth')
export class AuthController implements OnApplicationBootstrap {
  constructor(
    private readonly auth: AuthService,
    private readonly crypto: CryptoService,
    private readonly user: UserService,
    private readonly email: EmailService,
    private readonly config: Config,
    private readonly url: UrlService,
  ) {}

  async onApplicationBootstrap() {
    await this.createDefaultAdminUser()
  }

  @Get('/logout')
  logout(@Req() req: Request, @Res() res: Response, @Query('returnUrl') returnUrl: string) {
    req.session.user = undefined
    return this.url.safeRedirect(res, returnUrl || staticPath.login)
  }

  @Post('/login')
  async login(
    @Body() body: LoginBody,
    @Res() res: Response,
    @Session() session: PerfseeSession,
    @Query('returnUrl') returnUrl: string,
  ) {
    const user = await this.user.findUserByEmail(body.email)

    if (!user || !user.isFulfilled || user.isApp) {
      return res.redirect(this.errorPage(staticPath.login, 'INVALID_PASSWORD', { returnUrl }))
    }

    const password = await this.user.getUserPassword(user)

    if (!password || !this.crypto.verifyPassword(body.password, password)) {
      return res.redirect(this.errorPage(staticPath.login, 'INVALID_PASSWORD', { returnUrl }))
    }

    session.user = user
    return this.url.safeRedirect(res, returnUrl || staticPath.projects)
  }

  @Get('/reset-password')
  async sendResetPasswordEmail(
    @Res() res: Response,
    @Req() req: Request,
    @Query('returnUrl') returnUrl: string,
    @Query('email') email: string,
  ) {
    // POST requests also call this endpoint in e2e tests, but req.next fixes this somehow
    if (req.method === 'POST') {
      req.next?.()
      return
    }

    if (!email || !email.trim()) {
      throw new HttpException("Email can't be empty", HttpStatus.BAD_REQUEST)
    }

    const user = await this.user.findUserByEmail(email as string)
    if (!user || !user.isFulfilled || user.isApp) {
      throw new HttpException('Invalid email', HttpStatus.BAD_REQUEST)
    }

    const host = this.config.host
    const token = await this.auth.generatePasswordResetToken(user)

    const resetUrl = this.url.platformUrl(pathFactory.me.editPassword, void 0, { token })

    const title = 'Reset your password'
    const content =
      `Someone, hopefully you, has requested to reset the password for your account on ${host}.\n\n` +
      'If you did not perform this request, you can safely ignore this email.\n\n' +
      'Otherwise, click the link below to complete the process.\n\n'

    await this.email.sendMail({
      to: [user.email],
      subject: 'Password reset',
      text: content + resetUrl,
      html: passwordResetEmailTemplate({
        env: {
          host: this.url.platformUrl(pathFactory.home),
        },
        title,
        message: `<center>${content.replace(/\n/g, '<br>')}<a href="${resetUrl}">Reset password</a></center>`,
      }),
    })

    return this.url.safeRedirect(res, returnUrl || this.errorPage(staticPath.login, 'RESET_EMAIL_SENT'))
  }

  @Post('/reset-password')
  async resetPassword(@Body() body: ResetPasswordBody, @Res() res: Response, @Query('returnUrl') returnUrl: string) {
    if (!body.resetToken || !body.resetToken.trim()) {
      throw new HttpException("Reset token can't be empty", HttpStatus.BAD_REQUEST)
    }

    if (!body.password || !body.password.trim()) {
      throw new HttpException("Password can't be empty", HttpStatus.BAD_REQUEST)
    }

    if (body.password.length < 8) {
      throw new HttpException('Password must be at least 8 characters long', HttpStatus.BAD_REQUEST)
    }

    const user = await this.auth.validateAndDeletePasswordResetToken(body.resetToken)

    if (!user) {
      throw new HttpException(
        'Invalid token, or the token has expired, please re-request password reset.',
        HttpStatus.BAD_REQUEST,
      )
    }

    await this.user.updateUserPassword(user, this.crypto.encryptPassword(body.password))

    return this.url.safeRedirect(res, returnUrl || this.errorPage(staticPath.login, 'PASSWORD_HAS_RESET'))
  }

  @Post('/register')
  async register(
    @Body() body: RegisterBody,
    @Res() res: Response,
    @Session() session: PerfseeSession,
    @Query('returnUrl') returnUrl: string,
  ) {
    if (!body.email || !body.email.trim()) {
      throw new HttpException("Email can't be empty", HttpStatus.BAD_REQUEST)
    }

    if (!body.password || !body.password.trim()) {
      throw new HttpException("Password can't be empty", HttpStatus.BAD_REQUEST)
    }

    if (!body.username || !body.username.trim()) {
      throw new HttpException("Username can't be empty", HttpStatus.BAD_REQUEST)
    }

    if (body.password.length < 8) {
      throw new HttpException('Password must be at least 8 characters long', HttpStatus.BAD_REQUEST)
    }

    if (body.username.length < 5) {
      throw new HttpException('Username must be at least 5 characters long', HttpStatus.BAD_REQUEST)
    }

    const user = await this.user.findUserByEmail(body.email)

    if (user?.isFulfilled) {
      // if user exists
      return res.redirect(this.errorPage(staticPath.register, 'EMAIL_ALREADY_EXISTS', { returnUrl }))
    }

    const password = this.crypto.encryptPassword(body.password)
    const userInfo = {
      email: body.email,
      password,
      username: body.username,
      firstName: body.firstName,
      lastName: body.lastName,
    }
    const userCreated = user
      ? await this.user.updateUnfulfilledUser(user, userInfo)
      : await this.user.createUser(userInfo)

    session.user = userCreated
    return this.url.safeRedirect(res, returnUrl || staticPath.projects)
  }

  async createDefaultAdminUser() {
    const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@perfsee.com'
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin'

    if (await this.user.anyUsers()) {
      return
    }

    await this.user.createUser({
      email,
      password: this.crypto.encryptPassword(password),
      username: 'admin',
      isAdmin: true,
    })
  }

  private errorPage(url: string, code: string, other: any = {}) {
    return qs.stringifyUrl({ url, query: { statusCode: code, ...other } })
  }
}
