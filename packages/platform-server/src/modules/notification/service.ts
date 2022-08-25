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

import {
  Environment,
  Snapshot,
  SnapshotReport,
  Project,
  Setting,
  Artifact,
  SnapshotTrigger,
} from '@perfsee/platform-server/db'
import { Logger } from '@perfsee/platform-server/logger'
import { Redis } from '@perfsee/platform-server/redis'
import { BundleJobUpdate as BundleJobResultMessage } from '@perfsee/server-common'

import { ProjectService } from '../project/service'
import { SettingService } from '../setting/service'

import { NotificationProviderFactory } from './provider'
import { BundleNotificationInfo, CookieNotificationInfo, LabNotificationInfo, NotificationProvider } from './type'

@Injectable()
export class NotificationService {
  private readonly providers: Record<string, NotificationProvider>
  constructor(
    factory: NotificationProviderFactory,
    private readonly project: ProjectService,
    private readonly setting: SettingService,
    private readonly logger: Logger,
    private readonly redis: Redis,
  ) {
    this.providers = factory.getProviders()
  }

  async sendBundleJobNotification(artifact: Artifact, result: BundleJobResultMessage) {
    if (artifact.inProgress()) {
      return false
    }

    const notifiedKey = `bundle-job-notification-${artifact.id}`
    const duplicated = await this.redis.exists(notifiedKey)
    if (duplicated) {
      return false
    }

    const project = await Project.findOneByOrFail({ id: artifact.projectId })
    const setting = await Setting.findOneByOrFail({ projectId: project.id })
    const owners = await this.project.getProjectOwners(project)

    const info: BundleNotificationInfo = {
      artifact,
      result,
      project,
      projectSetting: setting,
      projectOwners: owners,
    }

    for (const providerName in this.providers) {
      const provider = this.providers[providerName]
      try {
        await provider.sendBundleNotification(info)
        this.logger.verbose(`[notification] provider ${providerName}, send bundle notification success`)
      } catch (err) {
        this.logger.error(
          `[notification] provider ${providerName}, send bundle notification failed` +
            (err instanceof Error ? err.stack : err),
        )
      }
    }

    await this.redis.set(notifiedKey, 1, 'EX', 3600)
  }

  async sendLabJobNotification(snapshot: Snapshot, reports: SnapshotReport[]) {
    const notifiedKey = `lab-job-notification-${snapshot.id}`
    const duplicated = await this.redis.exists(notifiedKey)
    if (duplicated || snapshot.trigger === SnapshotTrigger.Scheduler) {
      return false
    }

    const project = await Project.findOneByOrFail({ id: snapshot.projectId })
    const setting = await Setting.findOneByOrFail({ projectId: project.id })
    const owners = await this.project.getProjectOwners(project)

    const info: LabNotificationInfo = {
      snapshot,
      reports,
      project,
      projectSetting: setting,
      projectOwners: owners,
    }

    for (const providerName in this.providers) {
      const provider = this.providers[providerName]
      try {
        const success = await provider.sendLabNotification(info)
        if (success) this.logger.verbose(`[notification] provider ${providerName}, send lab notification success`)
      } catch (err) {
        this.logger.error(
          `[notification] provider ${providerName}, send lab notification failed` +
            (err instanceof Error ? err.stack : err),
        )
      }
    }

    await this.redis.set(notifiedKey, 1, 'EX', 3600)
  }

  async sendCookieNotification(projectId: number, environments: Environment[]) {
    const notifiedKey = `lab-cookie-notification-${projectId}`
    const duplicated = await this.redis.exists(notifiedKey)

    if (duplicated) {
      return false
    }

    const project = await this.project.loader.load(projectId)
    const setting = await this.setting.byProjectLoader.load(project.id)
    const owners = await this.project.getProjectOwners(project)

    const info: CookieNotificationInfo = {
      project,
      projectSetting: setting,
      projectOwners: owners,
      environments,
    }

    for (const providerName in this.providers) {
      const provider = this.providers[providerName]
      try {
        await provider.sendCookieNotification(info)
        this.logger.verbose(`[notification] provider ${providerName}, send cookie notification success`)
      } catch (err) {
        this.logger.error(
          `[notification] provider ${providerName}, send cookie notification failed` +
            (err instanceof Error ? err.stack : err),
        )
      }
    }

    await this.redis.set(notifiedKey, 1, 'EX', 3600)
  }
}
