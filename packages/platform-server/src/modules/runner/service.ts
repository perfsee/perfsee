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

import { ForbiddenException, Injectable } from '@nestjs/common'
import { isNil, omitBy } from 'lodash'
import { In } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { Runner, User } from '@perfsee/platform-server/db'
import { CryptoService } from '@perfsee/platform-server/helpers'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { JobType, RegisterRunnerParams, RegisterRunnerResponse, RunnerInfo } from '@perfsee/server-common'

import { ApplicationSettingService } from '../application-setting'
import { AuthService } from '../auth'
import { getJobTypeConcurrency } from '../job/service'

import { RunnerQueryFilter } from './types'

export function longestOnlineContactedTime() {
  return new Date(Date.now() - /* 2 hours */ 2 * 60 * 60 * 1000)
}

@Injectable()
export class RunnerService {
  loader = createDataLoader((uuids: string[]) => Runner.findBy({ uuid: In(uuids) }), 'uuid')

  constructor(
    private readonly crypto: CryptoService,
    private readonly setting: ApplicationSettingService,
    private readonly auth: AuthService,
  ) {}

  async register(params: RegisterRunnerParams): Promise<RegisterRunnerResponse> {
    const { token: registrationToken, info } = params
    const uniqueId = uuid()
    let runnerFromUser: User | false = false

    if (!(await this.setting.validateRegistrationToken(registrationToken))) {
      const accessToken = await this.auth.findByToken(registrationToken)
      if (accessToken) {
        const user = await User.findOneBy({ id: accessToken.userId })
        if (user) {
          runnerFromUser = user
        }
      }

      if (!runnerFromUser) {
        throw new ForbiddenException('Invalid registration token')
      }
    }

    const token = this.crypto.digest(`${uniqueId}:${registrationToken}`)
    if (runnerFromUser) {
      info.zone = `[USER:${runnerFromUser.username}]-${info.zone}`
    }

    const runner = await Runner.create({
      uuid: uniqueId,
      registrationToken,
      token,
      jobType: await this.getSuggestedRunnerJobType(params.info),
      active: true,
      contactedAt: new Date(),
      ...info,
    }).save()

    try {
      if (!runnerFromUser) {
        const settings = await this.setting.current()
        if (!settings.jobZones.includes(info.zone)) {
          settings.jobZones.push(info.zone)
          await this.setting.save(settings)
        }
      }
    } catch {
      // ignore
    }

    return {
      token,
      set: {
        jobType: runner.jobType,
        concurrency: getJobTypeConcurrency(runner.jobType),
      },
    }
  }

  async authenticateRunner(token: string, updates?: RunnerInfo) {
    const runner = token ? await Runner.findOneBy({ token }) : undefined

    if (!runner) {
      throw new ForbiddenException('Invalid runner token')
    }

    if (runner.active) {
      return this.updateRunner(runner, { ...updates, contactedAt: new Date() })
    }

    return runner
  }

  async getRunner(uuid: string) {
    return this.loader.load(uuid)
  }

  async getRunners(filters: RunnerQueryFilter) {
    const { active, online, jobType = JobType.All, zone, first, skip, after } = filters
    const builder = Runner.createQueryBuilder('runner')

    if (jobType === JobType.All) {
      builder.where('job_type in (:...jobTypes)', { jobTypes: Object.values(JobType) })
    } else {
      builder.where('job_type = :jobType', { jobType })
    }

    if (typeof active === 'boolean') {
      builder.andWhere('active is :active', { active: filters.active })
    }

    if (zone) {
      builder.andWhere('zone = :zone', { zone })
    }

    if (typeof online === 'boolean') {
      const onlineDeadline = longestOnlineContactedTime()
      builder.andWhere(`contacted_at ${online ? '>' : '<='} :onlineDeadline`, { onlineDeadline })
    }

    if (after) {
      builder.andWhere('created_at > :after', { after })
    }

    if (skip) {
      builder.skip(skip)
    }

    if (first) {
      builder.take(first)
    }

    builder.orderBy('id', 'ASC')

    return builder.getManyAndCount()
  }

  async deleteRunner(uuid: string) {
    const result = await Runner.delete({ uuid })
    return result.affected === 1
  }

  updateRunner(runner: Runner, updates: Partial<Runner>) {
    // TODO: should dynamic adjust runner consuming job type by task load
    //
    // if (!updates.jobType) {
    //   const jobType = await this.getSuggestedRunnerJobType()
    //   if (jobType !== runner.jobType) {
    //     updates.jobType = jobType
    //   }
    // }
    return Runner.save(Runner.merge(runner, omitBy(updates, isNil)), { reload: false })
  }

  private async getSuggestedRunnerJobType(info: RunnerInfo): Promise<JobType> {
    if (
      info.extra &&
      typeof info.extra.jobType === 'string' &&
      Object.values(JobType).includes(info.extra.jobType as JobType)
    ) {
      return info.extra.jobType as JobType
    }

    return Promise.resolve(JobType.All)
  }
}
