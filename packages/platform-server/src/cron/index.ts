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

import { applyDecorators, Global, Injectable, Module, OnApplicationBootstrap } from '@nestjs/common'
import { SchedulerRegistry, Cron as RawCron, CronOptions as RawCronOptions } from '@nestjs/schedule'

import { Logger } from '../logger'
import { Metric } from '../metrics'
import { Redis } from '../redis'

const EXCLUSIVE_CRONS = new Set<string>()

@Injectable()
class CronService implements OnApplicationBootstrap {
  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly logger: Logger,
    private readonly redis: Redis,
    private readonly metrics: Metric,
  ) {}

  onApplicationBootstrap() {
    this.replaceCronTick()
  }

  private replaceCronTick() {
    // raw fireOnTick:
    // for (var i = this._callbacks.length - 1; i >= 0; i--) {
    //	 this._callbacks[i].call(this.context, this.onComplete);
    // }
    for (const [name, job] of this.schedulerRegistry.getCronJobs()) {
      if (!EXCLUSIVE_CRONS.has(name)) {
        continue
      }

      const rawFire = job.fireOnTick

      job.fireOnTick = () => {
        const invoke = async () => {
          let acquired: string | null
          const raceKey = `CRON:${name}:RACE_FLAG`

          try {
            acquired = await this.redis.set(raceKey, 1, 'PX', job.nextDate().valueOf() - Date.now() - 1000, 'NX')

            if (acquired !== 'OK') {
              return
            }

            const ret = rawFire.call(job)
            if (ret instanceof Promise) {
              await ret
            }

            this.metrics.cronJobStatus(1, { name })
          } catch (e) {
            this.metrics.cronJobStatus(0, { name })
          }
        }

        invoke().catch(() => this.logger.error('Unavailable execution path'))
      }
    }
  }
}

@Global()
@Module({
  providers: [CronService],
})
export class CronModule {}

export type CronOptions = Omit<RawCronOptions, 'name'> & {
  /**
   * acquire lock before cron job to assure that the job will be executed only once even multiple instances deployed
   */
  exclusive: boolean
  name: string
} & {
  name?: string
}

export const Cron = (cronTime: string | Date, options?: CronOptions) => {
  if (options?.exclusive) {
    if (EXCLUSIVE_CRONS.has(options.name)) {
      throw new Error(`exclusive cron must have unique name, but the name '${options.name}' is not`)
    }
    EXCLUSIVE_CRONS.add(options.name)
  }
  return applyDecorators(RawCron(cronTime, options))
}

export { CronExpression } from '@nestjs/schedule'
