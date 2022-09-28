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

import { ApplicationSettingService } from '../application-setting'

import { SendMailOptions } from './types'

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null

  constructor(
    private readonly logger: Logger,
    private readonly config: Config,
    private readonly settings: ApplicationSettingService,
  ) {}

  async sendMail(options: SendMailOptions): Promise<boolean> {
    const settings = await this.settings.current()
    if (!settings.enableEmail) {
      return false
    }

    const { smtp: smtpOption, from } = this.config.email
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: smtpOption.host,
        port: smtpOption.port,
        secure: smtpOption.secure, // true for 465, false for other ports
        auth: {
          user: smtpOption.auth.user, // generated ethereal user
          pass: smtpOption.auth.password, // generated ethereal password
        },
        from: from,
      })
    }

    return this.transporter
      .sendMail({ ...options, from: this.config.email.from })
      .then(() => true)
      .catch((e) => {
        this.logger.error(e)
        return false
      })
  }
}
