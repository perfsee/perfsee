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

import { Injectable } from '@nestjs/common'
import nodemailer from 'nodemailer'

import { Config } from '@perfsee/platform-server/config'
import { Logger } from '@perfsee/platform-server/logger'

import { SendMailOptions } from './types'

@Injectable()
export class EmailService {
  private readonly transporter: nodemailer.Transporter | null = null

  constructor(private readonly logger: Logger, private readonly config: Config) {
    const email = config.email
    const { smtp: smtpOption, from } = email
    if (!smtpOption.host) {
      this.logger.warn('smtp is not configured, email service is unavailable.')
      return
    }
    this.transporter = nodemailer.createTransport({
      host: smtpOption.host,
      port: smtpOption.port,
      secure: smtpOption.secure, // true for 465, false for other ports
      auth: {
        user: smtpOption.auth.user, // generated ethereal user
        pass: smtpOption.auth.pass, // generated ethereal password
      },
      from: from,
    })
  }

  async sendMail(options: SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      return false
    }

    await this.transporter?.sendMail({ ...options, from: this.config.email.from })

    return true
  }
}
