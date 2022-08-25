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
import { noop } from 'lodash'

import { EventEmitter } from '@perfsee/platform-server/event'
import { Logger } from '@perfsee/platform-server/logger'
import { Redis } from '@perfsee/platform-server/redis'

const MAINTENANCE_MODE_KEY = '__PERFSEE_MAINTAINING__'

@Injectable()
export class MaintenanceService {
  private status: boolean | null = null

  constructor(private readonly logger: Logger, private readonly event: EventEmitter, private readonly redis: Redis) {
    this.start()
  }

  get isInMaintenanceMode() {
    return this.status ?? false
  }

  async update(status: boolean) {
    if (status) {
      await this.redis.set(MAINTENANCE_MODE_KEY, 'true')
    } else {
      await this.redis.del(MAINTENANCE_MODE_KEY)
    }
  }

  private start(delay = 500) {
    setTimeout(() => {
      this.getMaintenanceMode()
        .then((status) => {
          const prevStatus = this.status
          if (status !== prevStatus) {
            if (status) {
              this.logger.log('enter maintenance mode')
              this.event.emit('maintenance.enter')
            } else {
              this.logger.log('leave maintenance mode')
              this.event.emit('maintenance.leave')
            }
          }
          this.status = status
        })
        .catch(noop)
        .finally(() => {
          this.start(5000)
        })
    }, delay)
  }

  private async getMaintenanceMode() {
    try {
      return Boolean(await this.redis.exists(MAINTENANCE_MODE_KEY))
    } catch (e) {
      return false
    }
  }
}
