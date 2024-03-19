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

import { Controller, Get } from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import {
  MemoryHealthIndicator,
  HealthCheck,
  HealthCheckService,
  TypeOrmHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus'
import { compact } from 'lodash'

import { Cron, CronExpression } from '@perfsee/platform-server/cron'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { HealthCheckCategory } from '@perfsee/shared'

import { RedisIndicator } from './redis.indicator'

@ApiExcludeController()
@Controller('/health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly typeorm: TypeOrmHealthIndicator,
    private readonly redisIndicator: RedisIndicator,
    private readonly logger: Logger,
    private readonly metrics: Metric,
  ) {}

  @Get()
  @HealthCheck()
  async check(): Promise<HealthCheckResult> {
    // always response 200 to make webpack-dev-server proxy and `RxFetch` happy
    try {
      return await this.health.check(
        compact([
          () => this.memory.checkHeap(HealthCheckCategory.MemoryHeap, 500 * 1024 * 1024),
          () => this.memory.checkRSS(HealthCheckCategory.MemoryRSS, 3072 * 1024 * 1024),
          () => this.typeorm.pingCheck(HealthCheckCategory.Mysql),
          () => this.redisIndicator.check(),
        ]),
      )
    } catch (e: any) {
      this.logger.error(e)
      return e.response
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { exclusive: true, name: 'healcheck' })
  async cronHealthMetrics() {
    const platformHealth = await this.check()
    for (const [key, status] of Object.entries(platformHealth.details)) {
      this.metrics.serviceStatus(status.status === 'up' ? 1 : 0, { service: key })
    }
  }
}
