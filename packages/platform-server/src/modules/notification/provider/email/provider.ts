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

import { Config } from '@perfsee/platform-server/config'

import { EmailService } from '../../../email'
import { getBundleJobMessageTargets, getCookieMessageTargets, getLabJobMessageTargets } from '../../shared'
import { BundleNotificationInfo, CookieNotificationInfo, LabNotificationInfo, NotificationProvider } from '../../type'

import { bundleEmailTemplate } from './bundle-template'
import { cookieEmailTemplate } from './cookie-template'
import { labEmailTemplate } from './lab-template'

@Injectable()
export class EmailNotificationProvider implements NotificationProvider {
  constructor(private readonly email: EmailService, private readonly config: Config) {}

  async sendBundleNotification(info: BundleNotificationInfo) {
    const { projectSetting, artifact, result } = info
    const hasWarning = Object.values(result.entryPoints ?? {}).some((entrypoint) => entrypoint.warnings.length > 0)

    const emails = getBundleJobMessageTargets(projectSetting, artifact, hasWarning).emails

    if (!emails?.length) {
      return false
    }

    const template = bundleEmailTemplate(info, this.config.baseUrl)

    if (!template) {
      return false
    }

    return this.email.sendMail({
      ...template,
      to: emails,
    })
  }

  async sendLabNotification(info: LabNotificationInfo) {
    const emails = getLabJobMessageTargets(info.snapshot, info.projectSetting).emails

    if (!emails?.length) {
      return false
    }

    const template = labEmailTemplate(info, this.config.baseUrl)

    return this.email.sendMail({
      ...template,
      to: emails,
    })
  }

  async sendCookieNotification(info: CookieNotificationInfo) {
    const emails = getCookieMessageTargets(info.projectSetting, info.projectOwners).emails

    if (!emails?.length) {
      return false
    }

    const template = cookieEmailTemplate(info, this.config.baseUrl)

    return this.email.sendMail({
      ...template,
      to: emails,
    })
  }
}
