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

import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { isUndefined, omitBy } from 'lodash'

import { Config } from '@perfsee/platform-server/config'
import { AccessToken, ApplicationSetting, Runner, User } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { CryptoService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Redis } from '@perfsee/platform-server/redis'
import { DeepPartial } from '@perfsee/platform-server/utils/types'

@Injectable()
export class ApplicationSettingService implements OnApplicationBootstrap {
  private readonly cacheKey = `ApplicationSetting:${this.config.version}`

  private get cached(): Promise<ApplicationSetting | null> {
    return this.redis
      .get(this.cacheKey)
      .then((str) => str && ApplicationSetting.create(JSON.parse(str)))
      .catch(() => null)
  }

  constructor(
    private readonly crypto: CryptoService,
    private readonly config: Config,
    private readonly redis: Redis,
    private readonly logger: Logger,
  ) {}

  async onApplicationBootstrap() {
    await this.init()
  }

  async currentWithoutCache(): Promise<ApplicationSetting> {
    return ApplicationSetting.findOneBy({ id: 1 })
      .then(async (settings) => {
        return settings || this.createFromDefaults()
      })
      .then((settings) => this.cache(settings))
  }

  async current(): Promise<ApplicationSetting> {
    return this.cached
      .then((cache) => {
        return cache || this.currentWithoutCache()
      })
      .catch((e) => {
        if (this.config.prod) {
          this.logger.error(e)
        } else {
          throw e
        }
        return this.currentWithoutCache()
      })
  }

  async withSettings<T>(cb: (settings: ApplicationSetting) => T | Promise<T>): Promise<T> {
    return this.current().then((settings) => cb(settings))
  }

  async save(settings: ApplicationSetting) {
    await settings.save()
    return this.currentWithoutCache()
  }

  async update(input: DeepPartial<ApplicationSetting>) {
    await ApplicationSetting.update(1, omitBy(input, isUndefined))
    return this.currentWithoutCache()
  }

  async resetRegistrationToken() {
    const newToken = this.generateNewRegistrationToken()
    await this.update({
      registrationToken: newToken,
    })

    return newToken
  }

  async validateRegistrationToken(token: string) {
    return this.withSettings(
      (settings) => !this.config.runner.validateRegistrationToken || settings.registrationToken === token,
    )
  }

  async getZones(user?: User) {
    const settings = await this.current()
    const usersRunners = user ? await this.getUserRunnerZones(user) : []
    return {
      all: settings.jobZones.concat(usersRunners),
      default: settings.defaultJobZone,
    }
  }

  async insertAvailableJobZones(zones: string[]) {
    const settings = await this.current()
    settings.jobZones = Array.from(new Set([...zones, ...settings.jobZones]))
    await this.save(settings)

    return settings.jobZones
  }

  async deleteAvailableJobZones(zones: string[]) {
    const settings = await this.current()

    const set = new Set(settings.jobZones)
    zones.forEach((zone) => {
      if (zone === settings.defaultJobZone) {
        throw new UserError('Could not delete default job zone.')
      }
      set.delete(zone)
    })

    if (!set.size) {
      throw new UserError('There should be at least one available job zone.')
    }

    settings.jobZones = Array.from(set)
    await this.save(settings)

    return settings.jobZones
  }

  async setDefaultJobZone(zone: string) {
    const settings = await this.current()
    if (!settings.jobZones.includes(zone)) {
      throw new UserError('Trying to set default job zone that is not in available zones.')
    }
    settings.defaultJobZone = zone
    await this.save(settings)
    return settings.defaultJobZone
  }

  private async init() {
    await this.createFromDefaults()
  }

  private generateNewRegistrationToken() {
    return this.crypto.randomBytes(16).toString('base64')
  }

  private async createFromDefaults() {
    return ApplicationSetting.getRepository().manager.transaction(async (manager) => {
      const settings = await manager.findOneBy(ApplicationSetting, { id: 1 })
      if (settings) {
        return settings
      }

      return manager.save(ApplicationSetting, this.getDefaultSettings())
    })
  }

  private getDefaultSettings(): DeepPartial<ApplicationSetting> {
    return {
      id: 1,
      registrationToken: this.crypto.randomBytes(16).toString('base64'),
      jobZones: this.config.job.zones,
      defaultJobZone: this.config.job.defaultZone,
      enableSignup: this.config.auth.enableSignup,
      enableOauth: this.config.auth.enableOauth,
      enableProjectCreate: this.config.project.enableCreate,
      enableProjectDelete: this.config.project.enableDelete,
      enableProjectImport: this.config.project.enableImport,
      enableEmail: this.config.email.enable,
      userEmailConfirmation: true,
    }
  }

  private cache(settings: ApplicationSetting) {
    this.redis
      .set(this.cacheKey, JSON.stringify(settings), 'EX', this.config.applicationSettingCacheSec || 60)
      .catch((e) => {
        this.logger.error('Failed to cache application settings', e)
      })
    return settings
  }

  private async getUserRunnerZones(user: User): Promise<string[]> {
    const runners = await Runner.createQueryBuilder('runner')
      .select('DISTINCT runner.zone as zone')
      .innerJoin(AccessToken, 'token', 'token.token = runner.registration_token')
      .where('token.user_id = :userId', { userId: user.id })
      .getRawMany<{ zone: string }>()

    return runners.map((r) => r.zone)
  }
}
