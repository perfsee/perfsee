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
import { In } from 'typeorm'

import { Setting } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { EMAIL_REGEXP } from '@perfsee/shared'

@Injectable()
export class SettingService {
  readonly loader = createDataLoader((keys: number[]) =>
    Setting.findBy({
      id: In(keys),
    }),
  )

  readonly byProjectLoader = createDataLoader(
    (projectIds: number[]) =>
      Setting.findBy({
        projectId: In(projectIds),
      }),
    'projectId',
  )

  async updateSetting(projectId: number, updates: Partial<Setting>) {
    let setting = await this.byProjectLoader.load(projectId)
    setting = Setting.merge<Setting>(setting, updates, {
      bundleMessageBranches: updates.bundleMessageBranches?.filter(Boolean) ?? setting.bundleMessageBranches,
      messageTarget: {
        userEmails:
          updates.messageTarget?.userEmails.filter((email) => {
            if (!email || !EMAIL_REGEXP.test(email)) {
              throw new UserError('Invalid email format')
            }
            return true
          }) ?? setting.messageTarget.userEmails,
      },
    })
    return Setting.save(setting)
  }
}
