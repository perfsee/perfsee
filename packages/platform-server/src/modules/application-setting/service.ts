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

import { ApplicationSetting } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { CryptoService } from '@perfsee/platform-server/helpers'

@Injectable()
export class ApplicationSettingService implements OnApplicationBootstrap {
  constructor(private readonly crypto: CryptoService) {}

  async onApplicationBootstrap() {
    await this.init()
  }

  async resetRegistrationToken() {
    const newToken = this.generateNewToken()
    await this.update({
      registrationToken: newToken,
    })

    return newToken
  }

  async validateRegistrationToken(token: string) {
    if (process.env.NODE_ENV === 'development') {
      return true
    }

    const setting = await this.get()
    return token === setting.registrationToken
  }

  async get() {
    const setting = await ApplicationSetting.findOneBy({ id: 1 })
    if (!setting) {
      return this.init()
    }

    return setting
  }

  async getZones() {
    const settings = await this.get()
    return {
      all: settings.jobZones,
      default: settings.defaultJobZone,
    }
  }

  async insertAvailableJobZones(zones: string[]) {
    const settings = await this.get()
    settings.jobZones = Array.from(new Set([...zones, ...settings.jobZones]))
    await settings.save()

    return settings.jobZones
  }

  async deleteAvailableJobZones(zones: string[]) {
    const settings = await this.get()

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
    await settings.save()

    return settings.jobZones
  }

  async setDefaultJobZone(zone: string) {
    const settings = await this.get()
    if (!settings.jobZones.includes(zone)) {
      throw new UserError('Trying to set default job zone that is not in available zones.')
    }
    settings.defaultJobZone = zone
    await settings.save()
  }

  private async init() {
    let setting = await ApplicationSetting.findOneBy({ id: 1 })
    if (!setting) {
      try {
        setting = await ApplicationSetting.create({
          id: 1,
          registrationToken: this.generateNewToken(),
        }).save()
      } catch {
        // means other instance already init the settings
        setting = await ApplicationSetting.findOneBy({ id: 1 })
      }
    }
    return setting!
  }

  private update(input: Partial<ApplicationSetting>) {
    return ApplicationSetting.update(1, omitBy(input, isUndefined))
  }

  private generateNewToken() {
    return this.crypto.randomBytes(16).toString('base64')
  }
}
