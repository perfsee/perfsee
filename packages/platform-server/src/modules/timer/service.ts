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
import {
  ScheduleMonitorType,
  ScheduleType,
  Timer,
  Page,
  Profile,
  Environment,
  SnapshotTrigger,
} from '@perfsee/platform-server/db'
import { Logger } from '@perfsee/platform-server/logger'
import { Redis } from '@perfsee/platform-server/redis'
import { createDataLoader } from '@perfsee/platform-server/utils'

import { SnapshotService } from '../snapshot/service'

import { UpdateTimerInput } from './types'

const TEN_MINUTES = 1000 * 60 * 10
const ONE_HOUR = 1000 * 60 * 60

export function getTimerNextTime(timer: Partial<Timer>) {
  let nextTime
  const now = Date.now()

  if (!timer.schedule) {
    return new Date(now)
  }

  switch (timer.schedule) {
    case ScheduleType.Daily:
      nextTime = new Date().setHours(timer.timeOfDay ?? 0, 0, 0, 0)
      if (nextTime - now <= 1000) {
        nextTime = nextTime + ONE_HOUR * 24 // + 1day
      }
      break
    case ScheduleType.Hourly:
      nextTime = now + ONE_HOUR
      break
    case ScheduleType.EveryXHour:
      nextTime = now + ONE_HOUR * (timer.hour ?? 1)
      break
    case ScheduleType.Off:
      nextTime = now
      break
  }

  return new Date(nextTime)
}
@Injectable()
export class TimerService {
  loader = createDataLoader((ids: number[]) =>
    Timer.findBy({
      id: In(ids),
    }),
  )

  constructor(
    private readonly snapshotService: SnapshotService,
    private readonly logger: Logger,
    private readonly redis: Redis,
  ) {}

  async getTimer(projectId: number) {
    const timer = await Timer.findOneBy({ projectId })
    if (timer?.pageIds.length) {
      const pages = await Page.findBy({
        id: In(timer.pageIds),
      })
      timer.pageIds = pages.map((p) => p.iid)
    }
    if (timer?.profileIds.length) {
      const profiles = await Profile.findBy({ id: In(timer.profileIds) })
      timer.profileIds = profiles.map((p) => p.iid)
    }
    if (timer?.envIds.length) {
      const envs = await Environment.findBy({ id: In(timer.envIds) })
      timer.envIds = envs.map((e) => e.iid)
    }
    return timer
  }

  async updateTimer(projectId: number, patch: UpdateTimerInput) {
    let timer = await Timer.findOneBy({ projectId })
    const idUpdates: Partial<Timer> = {}

    if (patch.envIds?.length) {
      const envs = await Environment.findBy({ projectId, iid: In(patch.envIds) })
      idUpdates.envIds = envs.map((e) => e.id)
    }

    if (patch.profileIds?.length) {
      const profiles = await Profile.findBy({ projectId, iid: In(patch.profileIds) })
      idUpdates.profileIds = profiles.map((p) => p.id)
    }

    if (patch.pageIds?.length) {
      const pages = await Page.findBy({ projectId, iid: In(patch.pageIds) })
      idUpdates.pageIds = pages.map((p) => p.id)
    }

    const nextTime = getTimerNextTime(patch)

    if (timer) {
      Timer.merge<Timer>(timer, patch, idUpdates, { nextTriggerTime: nextTime })
      await timer.save()
    } else {
      timer = await Timer.create<Timer>({
        nextTriggerTime: nextTime,
        projectId,
        ...patch,
        ...idUpdates,
      }).save()
    }

    return Timer.merge<Timer>(timer, patch)
  }

  @Cron(CronExpression.EVERY_10_MINUTES, { exclusive: true, name: 'timer' })
  async refreshRunning() {
    const now = new Date()

    const timers = await Timer.createQueryBuilder()
      .where('schedule != :schedule', { schedule: ScheduleType.Off })
      .andWhere('next_trigger_time < :nextScanTime', { nextScanTime: new Date(now.getTime() + TEN_MINUTES) })
      .getMany()

    this.logger.log(`${timers.length} projects are time to dispatch.`)

    for (const timer of timers) {
      const scheduleKey = `cron_scheduled_${timer.projectId}`
      const scheduled = await this.redis.get(scheduleKey)
      if (scheduled) {
        continue
      }

      const restTime = timer.nextTriggerTime.getTime() - Date.now()
      this.logger.log(`dispatch a snapshot with projectId:${timer.projectId} and rest time is ${restTime}ms`)

      if (restTime <= 0) {
        this.dispatchSnapshot(timer).catch((err) => {
          this.logger.error('Failed to dispatch schedule job', err)
        })
      } else {
        setTimeout(() => {
          this.dispatchSnapshot(timer, true)
            .catch((err) => {
              this.logger.error('Failed to dispatch schedule job', err)
            })
            .finally(() => {
              this.redis.del(scheduleKey).catch(() => undefined)
            })
        }, restTime)

        await this.redis.set(scheduleKey, 1, 'EX', /* 11 mins */ 60 * 11)
      }
    }
  }

  private async dispatchSnapshot(rawTimer: Timer, check?: boolean) {
    if (check) {
      const needDispatch = await this.needDispatch(rawTimer.id)
      this.logger.log(`check timer needDispatch: ${needDispatch}`)

      if (!needDispatch) {
        return false
      }
    }

    const timer = await this.checkTimer(rawTimer)

    const nextTime = getTimerNextTime(timer)
    this.logger.log(`update next trigger time with project id: ${timer.projectId}, and next time is ${nextTime}`)
    await Timer.update(timer.id, {
      nextTriggerTime: nextTime,
    })

    const payload = await this.getTimerPayload(timer)

    await this.snapshotService.takeSnapshot(payload, true)
  }

  private async getTimerPayload(timer: Timer) {
    if (timer.monitorType === ScheduleMonitorType.All) {
      return {
        projectId: timer.projectId,
        trigger: SnapshotTrigger.Scheduler,
      }
    }

    const pageIids: number[] = []
    const profileIids: number[] = []
    const envIids: number[] = []

    const pages = await Page.findBy({ disable: false, projectId: timer.projectId })
    const envs = await Environment.findBy({ disable: false, projectId: timer.projectId })
    const profiles = await Profile.findBy({ disable: false, projectId: timer.projectId })

    const pageIdSet = new Set(timer.pageIds)
    const envIdSet = new Set(timer.envIds)
    const profileIdSet = new Set(timer.profileIds)

    if (pageIdSet.size) {
      pages.forEach((p) => {
        if (pageIdSet.has(p.id)) {
          pageIids.push(p.iid)
        }
      })
    }

    if (envIdSet.size) {
      envs.forEach((env) => {
        if (envIdSet.has(env.id)) {
          envIids.push(env.iid)
        }
      })
    }

    if (profileIdSet.size) {
      profiles.forEach((p) => {
        if (profileIdSet.has(p.id)) {
          profileIids.push(p.iid)
        }
      })
    }

    return {
      projectId: timer.projectId,
      pageIids,
      profileIids,
      envIids,
      trigger: SnapshotTrigger.Scheduler,
    }
  }

  private async needDispatch(id: number) {
    const t = await Timer.findOneBy({ id })
    if (!t || t.schedule === ScheduleType.Off) {
      return false
    }

    return t.nextTriggerTime.getTime() <= Date.now()
  }

  //  Update timer if page/profile/environment were deleted.
  private async checkTimer(timer: Timer) {
    if (timer.monitorType === ScheduleMonitorType.All) {
      return timer
    }

    const pageIds = await Page.createQueryBuilder()
      .select('id')
      .whereInIds(timer.pageIds)
      .getRawMany<{ id: number }>()
      .then((result) => result.map(({ id }) => id))

    const profileIds = await Profile.createQueryBuilder()
      .select('id')
      .whereInIds(timer.profileIds)
      .getRawMany<{ id: number }>()
      .then((result) => result.map(({ id }) => id))

    const envIds = await Environment.createQueryBuilder()
      .select('id')
      .whereInIds(timer.envIds)
      .getRawMany<{ id: number }>()
      .then((result) => result.map(({ id }) => id))

    timer.monitorType =
      !pageIds.length && !profileIds.length && !envIds.length ? ScheduleMonitorType.All : ScheduleMonitorType.Specified

    timer.pageIds = pageIds
    timer.profileIds = profileIds
    timer.envIds = envIds

    return Timer.save(timer)
  }
}
