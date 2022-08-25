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

import { logger } from '@perfsee/job-runner-shared'
import { JobInfo } from '@perfsee/server-common'
import { JobLogLevel } from '@perfsee/shared'

import { ConfigManager } from './config'
import { localRunnerScriptEntry } from './local-entry'
import { PlatformClient } from './platform-client'
import { JobWorkerExecutor } from './worker'

export class Runner {
  private readonly client: PlatformClient
  private readonly runningJobs = new Map</* jobId */ number, JobWorkerExecutor>()
  private pulling = false

  get config() {
    return this.configManager.load()
  }
  get concurrency() {
    return this.config.runner.concurrency
  }

  constructor(private readonly configManager: ConfigManager) {
    this.client = new PlatformClient(this.configManager.load())
  }

  start() {
    setInterval(() => {
      if (!this.pulling) {
        this.pulling = true
        this.pullAndExecute()
          .catch((e) => {
            logger.error(e)
          })
          .finally(() => {
            this.pulling = false
          })
      }
    }, this.config.runner.checkInterval * 1000)
  }

  private async pullAndExecute() {
    if (this.runningJobs.size >= this.concurrency) {
      return
    }

    const JobRequestResponse = await this.client.requestJob()

    if (!JobRequestResponse) {
      return
    }

    if (JobRequestResponse.set) {
      this.configManager.patch({ runner: JobRequestResponse.set })
    }

    const job = JobRequestResponse.job
    if (!job) {
      return
    }

    let runnerScriptEntry = undefined
    try {
      const runnerScriptPackage = await this.client.installActivatedRunnerScript(job.jobType)
      if (runnerScriptPackage) {
        runnerScriptEntry = require.resolve(runnerScriptPackage)
      }
    } catch (e) {
      this.failedJob(job, `Failed to install runner script [event=${job.jobType}, id=${job.jobId}]`, e)
      return
    }

    if (!runnerScriptEntry) {
      if (process.env.NODE_ENV === 'development') {
        runnerScriptEntry = localRunnerScriptEntry(job.jobType)
      } else {
        this.failedJob(job, `Runner script not found for ${job.jobType}`)
        return
      }
    }

    this.executeJob(job, runnerScriptEntry)
  }

  private executeJob(job: JobInfo, workerScriptEntry: string) {
    const executor = new JobWorkerExecutor(workerScriptEntry, job, this.config)

    executor
      .on('update', ({ trace, ...updates }, done) => {
        void this.client
          .updateJobTrace({
            jobId: job.jobId,
            trace: trace ?? [],
            ...updates,
          })
          .then((response) => {
            if (!response) {
              done(new Error('Failed to update job trace'))
            } else if (response.canceled) {
              void executor.terminateWorker('canceled')
            } else {
              done()
            }
          })
          .catch((e) => {
            done(e)
          })
      })
      // this is in a rare case,
      // because we should've already taken care all the errors that could happened.
      .on('error', (error) => {
        this.failedJob(job, error)
        this.runningJobs.delete(job.jobId)
      })
      .on('end', () => {
        this.runningJobs.delete(job.jobId)
      })

    this.runningJobs.set(job.jobId, executor)
    executor.start().catch((e) => {
      logger.error(e)
    })
  }

  private failedJob(job: JobInfo, ...reasons: any[]) {
    logger.error(`job failed [type=${job.jobType}, id=${job.jobId}]`, reasons)
    void this.client.updateJobTrace({
      jobId: job.jobId,
      done: true,
      failedReason: 'Internal Error',
      trace: [
        [
          JobLogLevel.error,
          Date.now(),
          `job failed [type=${job.jobType}]` +
            (reasons.map((reason) => (reason instanceof Error ? reason.stack : JSON.stringify(reason))).join(' ') ||
              'unknown reason'),
        ],
      ],
    })
  }
}
