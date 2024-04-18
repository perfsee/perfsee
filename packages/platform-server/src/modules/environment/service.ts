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

import { Cron, CronExpression } from '@perfsee/platform-server/cron'
import { Environment, InternalIdUsage } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { checkUserScript, createDataLoader } from '@perfsee/platform-server/utils'

import { NotificationService } from '../notification/service'
import { SnapshotReportService } from '../snapshot/snapshot-report/service'

import { UpdateEnvironmentInput } from './types'

@Injectable()
export class EnvironmentService {
  loader = createDataLoader((ids: number[]) => Environment.findBy({ id: In(ids) }))

  constructor(
    private readonly notification: NotificationService,
    private readonly logger: Logger,
    private readonly internalIdService: InternalIdService,
    private readonly reportService: SnapshotReportService,
  ) {}

  getEnvironments(projectId: number) {
    return Environment.findBy({ projectId })
  }

  getEnvironment(projectId: number, iid: number) {
    return Environment.findOneByOrFail({ projectId, iid })
  }

  async updateEnvironment(projectId: number, patch: UpdateEnvironmentInput) {
    if (patch.loginScript) {
      checkUserScript(patch.loginScript)
    }
    if (patch.name) {
      const existed = await Environment.findOneBy({ projectId, name: patch.name })
      if (existed && existed.iid !== patch.iid) {
        throw new UserError(`environment with name ${patch.name} exists.`)
      }
    }

    // verify localStorage items
    // limit key/value length to 1024 bytes
    if (patch.localStorage) {
      patch.localStorage.forEach(({ key, value }) => {
        try {
          if (JSON.stringify(key).length > 1024 || JSON.stringify(value).length > 1024) {
            throw new UserError(`environment localStorage key or value exceed 1024 bytes.`)
          }
        } catch (e) {
          throw new UserError(`invalid environment localStorage key or value.`)
        }
      })
    }

    // create
    if (!patch.iid) {
      const iid = await this.internalIdService.generate(projectId, InternalIdUsage.Env)
      const env = { ...patch, projectId, iid }
      return Environment.create<Environment>(env).save()
    }

    // update
    let env = await Environment.findOneByOrFail({ projectId, iid: patch.iid })

    env = Environment.merge<Environment>(env, patch)

    return Environment.save(env) // update
  }

  async deleteEnvironment(env: Environment) {
    const { id, projectId, name } = env

    this.logger.log('start delete environment', { id, projectId, name })
    await this.reportService.deleteSnapshotsReports(projectId, { envId: id })
    await Environment.delete(id)
  }

  @Cron(CronExpression.EVERY_DAY_AT_11AM, { timeZone: 'Asia/Shanghai', exclusive: true, name: 'cookie-check' })
  async noticeUpdateCookie() {
    const environments = await Environment.findBy({ needReminder: true, disable: false })

    if (!environments.length) {
      return
    }

    const lastTTL = new Date().setHours(23, 0, 0, 0)
    const map = new Map<number /**projectId */, Environment[]>()
    for (const env of environments) {
      const needNotice = env.cookies.some((cookie) => cookie.expire && new Date(cookie.expire).getTime() <= lastTTL)

      if (needNotice) {
        const values = map.get(env.projectId) ?? []
        map.set(env.projectId, [...values, env])
      }
    }

    if (!map.size) {
      return
    }

    for (const [projectId, envs] of map) {
      await this.notification
        .sendCookieNotification(projectId, envs)
        .then((targets) => {
          if (targets) {
            this.logger.verbose('Notification sent', { projectId: projectId, environments: envs, targets })
          }
        })
        .catch((e) => {
          this.logger.error(e, { phase: 'notification' })
        })
    }
  }
}
