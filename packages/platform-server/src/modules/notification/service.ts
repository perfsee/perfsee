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

import { Environment, Setting, SnapshotTrigger } from '@perfsee/platform-server/db'
import { OnEvent } from '@perfsee/platform-server/event'
import {
  AnalyzeUpdateType,
  BundleUpdatePayload,
  PackageUpdatePayload,
  SnapshotUpdatePayload,
} from '@perfsee/platform-server/event/type'
import { Logger } from '@perfsee/platform-server/logger'
import { Redis } from '@perfsee/platform-server/redis'
import { BundleJobPassedUpdate, BundleJobStatus, SnapshotStatus, PackageJobPassedUpdate } from '@perfsee/server-common'
import { Permission } from '@perfsee/shared'

import { ProjectService } from '../project/service'
import { SettingService } from '../setting/service'

import { NotificationProviderFactory } from './provider'
import {
  BundleNotificationInfo,
  CookieNotificationInfo,
  LabNotificationInfo,
  NotificationProvider,
  PackageNotificationInfo,
} from './type'

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

  @OnEvent(`${AnalyzeUpdateType.ArtifactUpdate}.${BundleJobStatus.Passed}`)
  async sendBundleJobNotification(payload: BundleUpdatePayload) {
    const { artifact, bundleJobResult, project } = payload
    const notifiedKey = `bundle-job-notification-${artifact.id}`
    const duplicated = await this.redis.exists(notifiedKey)
    if (duplicated) {
      return false
    }

    const setting = await Setting.findOneByOrFail({ projectId: project.id })
    const owners = await this.project.getProjectUsers(project, Permission.Admin)

    const info: BundleNotificationInfo = {
      artifact,
      result: bundleJobResult as BundleJobPassedUpdate,
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

  @OnEvent(`${AnalyzeUpdateType.PackageUpdate}.${BundleJobStatus.Passed}`)
  async sendPackageJobNotification(payload: PackageUpdatePayload) {
    const { bundle: packageBundle, project, packageJobResult } = payload
    if (packageBundle.inProgress()) {
      return false
    }

    const notifiedKey = `package-job-notification-${packageBundle.id}`
    const duplicated = await this.redis.exists(notifiedKey)
    if (duplicated) {
      return false
    }

    const setting = await Setting.findOneByOrFail({ projectId: project.id })
    const owners = await this.project.getProjectUsers(project, Permission.Admin)

    const info: PackageNotificationInfo = {
      package: packageBundle,
      result: packageJobResult as PackageJobPassedUpdate,
      project,
      projectSetting: setting,
      projectOwners: owners,
    }

    for (const providerName in this.providers) {
      const provider = this.providers[providerName]
      try {
        await provider.sendPackageNotification(info)
        this.logger.verbose(`[notification] provider ${providerName}, send package notification success`)
      } catch (err) {
        this.logger.error(
          `[notification] provider ${providerName}, send package notification failed` +
            (err instanceof Error ? err.stack : err),
        )
      }
    }

    await this.redis.set(notifiedKey, 1, 'EX', 3600)
  }

  @OnEvent(`${AnalyzeUpdateType.SnapshotUpdate}.${SnapshotStatus.Completed}`)
  async sendLabJobNotification(payload: SnapshotUpdatePayload) {
    const { snapshot, reports, project } = payload
    const notifiedKey = `lab-job-notification-${snapshot.id}`
    const duplicated = await this.redis.exists(notifiedKey)
    if (duplicated || snapshot.trigger === SnapshotTrigger.Scheduler) {
      return false
    }

    const setting = await Setting.findOneByOrFail({ projectId: project.id })
    const owners = await this.project.getProjectUsers(project, Permission.Admin)

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

    if (!project) {
      return false
    }

    const setting = await this.setting.byProjectLoader.load(project.id)

    if (!setting) {
      return false
    }

    const owners = await this.project.getProjectUsers(project, Permission.Admin)

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
