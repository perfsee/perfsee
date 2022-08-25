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
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus'

import { Redis } from '@perfsee/platform-server/redis'
import { HealthCheckCategory } from '@perfsee/shared'

@Injectable()
export class RedisIndicator extends HealthIndicator {
  constructor(private readonly redis: Redis) {
    super()
  }

  async check(): Promise<HealthIndicatorResult> {
    try {
      await this.redis.set(`PLATFORM_SERVER_REDIS_HEALTH_CHECK`, 1)
      return {
        [HealthCheckCategory.Redis]: {
          status: 'up',
        },
      }
    } catch (e) {
      throw new HealthCheckError('Set key to redis server failed', {
        [HealthCheckCategory.Redis]: {
          status: 'down',
          message: (e as Error).message,
        },
      })
    }
  }
}
