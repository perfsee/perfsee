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
import { isNil, omitBy } from 'lodash'

import { RunnerScript } from '@perfsee/platform-server/db'
import { JobType } from '@perfsee/server-common'

export function longestOnlineContactedTime() {
  return new Date(Date.now() - /* 2 hours */ 2 * 60 * 60 * 1000)
}

interface CreateRunnerScriptParams {
  version: string
  storageKey: string
  sha256: string
  jobType: JobType
  description?: string
  size: number
  enable: boolean
}

const validJobTypeRegex = /^[a-zA-Z][a-zA-Z0-9._-]+[a-zA-Z0-9]$/

@Injectable()
export class RunnerScriptService {
  constructor() {}

  async create(input: CreateRunnerScriptParams) {
    if (!validJobTypeRegex.test(input.jobType)) {
      throw new Error('Invalid job type')
    }

    const script = await RunnerScript.findOne({ where: { jobType: input.jobType, version: input.version } })

    if (script) {
      throw new Error('Runner script already exists')
    }

    return RunnerScript.create(input).save()
  }

  getActivated(jobType: string) {
    const builder = RunnerScript.createQueryBuilder()
    builder.where('job_type = :jobType', { jobType })
    builder.andWhere('enable = true')
    builder.orderBy('created_at', 'DESC')

    return builder.getOne()
  }

  getRunnerScripts(jobType: string) {
    return RunnerScript.find({ where: { jobType: jobType } })
  }

  async getExtensionScripts(jobType: string) {
    const ids = (
      await RunnerScript.createQueryBuilder()
        .select(['MAX(id) as rid'])
        .where('job_type like :jobType', { jobType: `${jobType}%` })
        .andWhere('enable = true')
        .groupBy('job_type')
        .getRawMany<{ rid: number }>()
    ).map(({ rid }) => rid)
    if (!ids.length) {
      return []
    }
    return RunnerScript.createQueryBuilder().where('id in (:...ids)', { ids }).getMany()
  }

  async updateRunnerScripts(jobType: string, version: string, update: Partial<RunnerScript>) {
    if (update.jobType && !validJobTypeRegex.test(update.jobType)) {
      throw new Error('Invalid job type')
    }
    const script = await RunnerScript.findOneOrFail({ where: { jobType, version } })
    return RunnerScript.save(RunnerScript.merge(script, omitBy(update, isNil)))
  }
}
