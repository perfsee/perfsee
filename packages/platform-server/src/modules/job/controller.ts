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

import {
  Controller,
  Post,
  Body,
  Headers,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  Res,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { Response } from 'express'

import { Config } from '@perfsee/platform-server/config'
import { Cron, CronExpression } from '@perfsee/platform-server/cron'
import { Job } from '@perfsee/platform-server/db'
import { EventEmitter } from '@perfsee/platform-server/event'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { artifactKey } from '@perfsee/platform-server/utils/artifact-link'
import {
  JobRequestParams,
  JobRequestResponse,
  UpdateJobTraceParams,
  UpdateJobTraceResponse,
} from '@perfsee/server-common'

import { MaintenanceService } from '../maintenance/service'
import { RunnerService } from '../runner/service'

import { RequestQueue } from './request-queue'
import { getJobTypeConcurrency, JobService } from './service'

@ApiExcludeController()
@Controller('/jobs')
export class JobController {
  private readonly queue!: RequestQueue

  constructor(
    private readonly config: Config,
    private readonly service: JobService,
    private readonly event: EventEmitter,
    private readonly logger: Logger,
    private readonly metrics: Metric,
    private readonly runner: RunnerService,
    private readonly maintenance: MaintenanceService,
    private readonly storage: ObjectStorage,
  ) {
    const jobConfig = this.config.job

    this.queue = new RequestQueue(
      jobConfig.pollingLimit,
      jobConfig.pollingQueueLimit,
      jobConfig.pollingTimeoutSec * 1000,
    )
  }

  @Post('/request')
  @HttpCode(HttpStatus.OK)
  async getJobsAndRun(
    @Headers('x-runner-token') token: string,
    @Body() params: JobRequestParams,
  ): Promise<JobRequestResponse> {
    if (this.maintenance.isInMaintenanceMode) {
      return {}
    }

    const runner = await this.runner.authenticateRunner(token, params.info)

    if (!runner.active) {
      return {}
    }

    const response: JobRequestResponse = {
      set: {
        jobType: runner.jobType,
        concurrency: getJobTypeConcurrency(runner.jobType),
      },
    }

    try {
      const job = await this.queue.enqueue(() => this.service.requestJob(runner))

      if (job) {
        response.job = {
          jobId: job.id,
          jobType: job.jobType,
          timeout: this.config.job.executionTimeoutSec,
          payload: job.payload,
        }
      }
    } catch (e) {
      this.logger.error(e, { phase: 'request job' })
    }

    return response
  }

  @Post('/trace')
  @HttpCode(HttpStatus.ACCEPTED)
  async updateJobTrace(
    @Headers('x-runner-token') token: string,
    @Body() params: UpdateJobTraceParams,
  ): Promise<UpdateJobTraceResponse> {
    const runner = await this.runner.authenticateRunner(token)
    const job = await this.service.updateJobTrace(params, runner)

    if (params.jobUpdates) {
      this.event.emit(`${job.jobType}.update`, params.jobUpdates.payload)
    }

    if (params.failedReason) {
      this.event.emit(`${job.jobType}.error`, job.entityId, params.failedReason)
    }

    return {
      canceled: job.canceled(),
    }
  }

  @Post('/artifacts')
  @HttpCode(HttpStatus.CREATED)
  async uploadArtifact(
    @Body() buf: Buffer,
    @Query('jobId') jobId: string,
    @Query('key') key: string,
    @Headers('x-runner-token') token: string,
  ) {
    let id
    try {
      id = parseInt(jobId)
      // eslint-disable-next-line no-empty
    } catch {}
    if (!id) {
      throw new ForbiddenException('Invalid jobId')
    }

    const runner = await this.runner.authenticateRunner(token)
    const job = await Job.findOneBy({ id })

    if (!job) {
      throw new NotFoundException('Job not found')
    }

    if (job.runnerId !== runner.id) {
      throw new ForbiddenException('JobId not match the runner')
    }

    const finalKey = artifactKey(job.projectId, key)
    await this.storage.upload(finalKey, buf)

    this.event.emit(`${job.jobType}.upload`, job.entityId, buf.byteLength)
    return {
      key: finalKey,
      size: buf.byteLength,
    }
  }

  @Get('/artifacts')
  async getArtifact(@Query('key') key: string, @Res() res: Response, @Headers('x-runner-token') token: string) {
    await this.runner.authenticateRunner(token)
    const stream = await this.storage.getStream(key)
    stream.on('error', (error: any) => {
      switch (error.code) {
        case 'ENAMETOOLONG':
        case 'ENOENT':
        case 'ENOTDIR':
          res.sendStatus(404)
          break
        default:
          res.sendStatus(500)
          break
      }
    })
    stream.pipe(res)
  }

  @Cron(CronExpression.EVERY_HOUR, { exclusive: true, name: 'timeout-jobs' })
  async timeoutJobs() {
    const jobs = await this.service.getAndUpdateTimeoutJobs()

    jobs.forEach((job) => {
      this.event.emit(`${job.jobType}.error`, job.entityId, 'Timeout')
      this.metrics.jobFail(1, { jobType: job.jobType })
    })
  }
}
