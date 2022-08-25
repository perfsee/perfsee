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

@Injectable()
export class RunnerScriptService {
  constructor() {}

  async create(input: CreateRunnerScriptParams) {
    const script = await RunnerScript.findOne({ where: { jobType: input.jobType, version: input.version } })

    if (script) {
      throw new Error('Runner script already exists')
    }

    return RunnerScript.create(input).save()
  }

  getActivated(jobType: JobType) {
    const builder = RunnerScript.createQueryBuilder()
    builder.where('job_type = :jobType', { jobType })
    builder.andWhere('enable = true')
    builder.orderBy('created_at', 'DESC')

    return builder.getOne()
  }

  getRunnerScripts(jobType: JobType) {
    return RunnerScript.find({ where: { jobType: jobType } })
  }

  async updateRunnerScripts(jobType: JobType, version: string, update: Partial<RunnerScript>) {
    const script = await RunnerScript.findOneOrFail({ where: { jobType, version } })
    return RunnerScript.save(RunnerScript.merge(script, omitBy(update, isNil)))
  }
}
