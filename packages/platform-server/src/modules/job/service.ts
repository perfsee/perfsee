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

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { countBy } from 'lodash'
import { Between, In } from 'typeorm'

import {
  ApplicationSetting,
  Artifact,
  InternalIdUsage,
  Job,
  JobStatus,
  Runner,
  SnapshotReport,
} from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { OnEvent } from '@perfsee/platform-server/event'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { Redis } from '@perfsee/platform-server/redis'
import { JobLogStorage } from '@perfsee/platform-server/storage'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { CreateJobEvent, JobType, UNKNOWN_RUNNER_ZONE, UpdateJobTraceParams } from '@perfsee/server-common'
import { JobLog, JobLogLevel } from '@perfsee/shared'

import { ProjectUsageService } from '../project-usage/service'

import { TimeUsageInput } from './types'

// @ts-expect-error by design
const JOB_GROUPS: Record<JobType, JobType[]> = {
  [JobType.BundleAnalyze]: [JobType.BundleAnalyze],
  [JobType.LabAnalyze]: [JobType.LabAnalyze, JobType.E2EAnalyze, JobType.LabPing],
  [JobType.SourceAnalyze]: [JobType.SourceAnalyze],
}

const JOB_GROUPS_REVERSE = Object.entries(JOB_GROUPS).reduce((result, [groupType, groupMembers]) => {
  groupMembers.forEach((member) => {
    result[member] = groupType
  })
  return result
}, {}) as Record<JobType, JobType>

const JOB_RECOMMENDED_CONCURRENCY = {
  [JobType.All]: 1,
  [JobType.BundleAnalyze]: 3,
  [JobType.LabAnalyze]: 1,
  [JobType.SourceAnalyze]: 5,
}

export function getJobTypeConcurrency(type: JobType): number {
  return JOB_RECOMMENDED_CONCURRENCY[JOB_GROUPS_REVERSE[type]] ?? JOB_RECOMMENDED_CONCURRENCY[JobType.All]
}

export function getJobTypeGroup(type: JobType): JobType[] {
  return JOB_GROUPS[JOB_GROUPS_REVERSE[type]]
}

export function getJobGroupNames(): JobType[] {
  // @ts-expect-error safe cast from string[]
  return Object.keys(JOB_GROUPS)
}

function getLogStorageKey(job: Job) {
  return `logs/${job.projectId}/${job.jobType}/${job.id}.json`
}

const LATEST_DONE_JOB_KEY = 'LATEST_DONE_JOB_ID'

type PayloadGetter = (entityId: number, extra: Record<string, string> | null) => Promise<any>

@Injectable()
export class JobService {
  idLoader = createDataLoader((ids: number[]) =>
    Job.findBy({
      id: In(ids),
    }),
  )
  runnerRunningJobCountLoader = createDataLoader((runnerIds: number[]) => {
    return Job.createQueryBuilder('job')
      .select(['runner_id as runnerId', 'count(*) as count'])
      .where('status = :status', { status: JobStatus.Running })
      .andWhere('runner_id in (:...runnerIds)', { runnerIds })
      .groupBy('runnerId')
      .getRawMany<{ runnerId: number; count: number }>()
  }, 'runnerId')

  private readonly jobPayloadGetters = new Map<JobType, PayloadGetter>()

  constructor(
    private readonly logger: Logger,
    private readonly metrics: Metric,
    private readonly internalId: InternalIdService,
    private readonly redis: Redis,
    private readonly logStorage: JobLogStorage,
    private readonly projectUsage: ProjectUsageService,
  ) {}

  @OnEvent('job.create')
  async createJobs(events: CreateJobEvent | CreateJobEvent[]) {
    const jobs: Job[] = []
    if (!Array.isArray(events)) {
      events = [events]
    }

    for (const event of events) {
      const job = await this.createJob(event)

      if (job) {
        jobs.push(job)
      }
    }

    await Job.insert(jobs)
    await this.recordJobCount(jobs)
    this.recordJobCreating(jobs)
  }

  @OnEvent('job.register_payload_getter')
  registerPayloadGetter(type: JobType, getter: PayloadGetter) {
    if (this.jobPayloadGetters.has(type)) {
      this.logger.warn(`payload getter with job type ${type} has already been registered.`)
    } else {
      this.logger.log(`payload getter with job type ${type} registered`)
    }
    this.jobPayloadGetters.set(type, getter)
  }

  async getQueuedJobs(runner: Runner) {
    const qb = Job.createQueryBuilder().where('status = :status', { status: JobStatus.Pending })

    if (runner.zone !== UNKNOWN_RUNNER_ZONE) {
      qb.andWhere('zone = :zone', { zone: runner.zone })

      // accelerate query with cached latest job id
      const latestDoneJobId = await this.getLatestDoneJobId(runner.jobType, runner.zone)
      if (latestDoneJobId) {
        qb.andWhere('id > :id', { id: latestDoneJobId })
      }
    }

    if (runner.jobType !== JobType.All) {
      const types = getJobTypeGroup(runner.jobType)
      if (types.length === 1) {
        qb.andWhere('job_type = :type', {
          type: types[0],
        })
      } else if (types.length > 1) {
        qb.andWhere('job_type in (:...types)', {
          types,
        })
      } else {
        qb.andWhere('job_type = :type', {
          type: runner.jobType,
        })
      }
    }

    return qb.orderBy('id', 'ASC').take(20).getMany()
  }

  async assignRunner(job: Job, runner: Runner) {
    job.runnerId = runner.id
    job.startedAt = new Date()
    job.status = JobStatus.Running
    await job.save({ reload: false })
    this.metrics.jobPendingTime(job.startedAt.getTime() - job.createdAt.getTime(), { jobType: job.jobType })
  }

  async getPendingJobsCount() {
    const pendingJobs = await Job.createQueryBuilder()
      .select(['job_type as jobType', 'count(id) as count'])
      .where('status = :status', { status: JobStatus.Pending })
      .groupBy('jobType')
      .getRawMany<{ jobType: string; count: number }>()

    return Object.values(JobType)
      .filter((jobType) => jobType !== JobType.All)
      .map((jobType) => ({
        jobType,
        count: pendingJobs.find((record) => record.jobType === jobType)?.count ?? 0,
      }))
  }

  async getAndUpdateTimeoutJobs() {
    const jobs = await Job.createQueryBuilder()
      .where('status = :status', { status: JobStatus.Running })
      .andWhere('started_at < (DATE_SUB(NOW(), INTERVAL 1 HOUR))')
      .getMany()

    const projectDurations: Record<number, number> = {}

    jobs.forEach((job) => {
      job.status = JobStatus.Done

      const duration = job.startedAt ? new Date().getTime() - job.startedAt.getTime() : /* 1 hour */ 3600000
      projectDurations[job.projectId] = projectDurations[job.projectId]
        ? projectDurations[job.projectId] + duration
        : duration

      this.logger.error('timeout', { job })
    })

    await Job.save(jobs)
    for (const [projectId, duration] of Object.entries(projectDurations)) {
      await this.projectUsage.recordJobDurationUsage(Number(projectId), duration)
    }

    return jobs
  }

  // JobType.LabAnalyze: projectId + snapshotReportIid
  // JobType.E2eAnalyze: projectId + snapshotReportIid
  // JobType.BundleAnalyze: projectId + artifactIid
  // JobType.SourceAnalyze: projectId + snapshotReportIid
  // else: entityId
  async getJobByEntityId(jobType: JobType, entityId: number, projectId: number) {
    const realId = await this.getEntityRealId(jobType, entityId, projectId)
    if (!realId) {
      return null
    }

    return Job.findOne({ where: { projectId, jobType, entityId: realId }, order: { id: 'desc' } })
  }

  async getJobPayload(job: Job): Promise<any> {
    const { jobType, entityId, extra } = job

    const payloadGetter = this.jobPayloadGetters.get(jobType)
    if (!payloadGetter) {
      throw new Error(`Invalid type found for getting payload: ${jobType}`)
    }

    try {
      return await payloadGetter(entityId, extra)
    } catch (e) {
      this.logger.error(e as Error, { ...job, phase: 'fetch job payload' })
      await this.jobDone(job.id, 0, true, [[JobLogLevel.error, Date.now(), 'Failed to fetch job payload.', String(e)]])
      return null
    }
  }

  async jobDone(id: number, duration: number, errored?: boolean, pendingLogs?: JobLog[]) {
    const job = await Job.findOneBy({ id })
    if (job) {
      job.status = JobStatus.Done
      // duration is the exact time that job runner spent on job execution,
      // which is more accurate then `job.endedAt` - `job.startedAt`
      job.duration = duration
      job.endedAt = new Date()
      await job.save({ reload: false })

      await this.projectUsage.recordJobDurationUsage(job.projectId, duration)
      try {
        if (pendingLogs?.length) {
          await this.writeLogs(job, pendingLogs)
        }
      } catch (e) {
        this.logger.error(e as Error, { phase: 'write logs' })
      }

      if (errored) {
        this.metrics.jobFail(1, { jobType: job.jobType })
      } else {
        await this.setLatestDoneJobId(job.jobType, job.zone, job.id)
        this.metrics.jobSuccess(1, { jobType: job.jobType })
      }
    }
  }

  async updateJobTrace({ jobId, trace, done, duration }: UpdateJobTraceParams, runner: Runner) {
    const job = await this.idLoader.load(jobId)
    if (!job) {
      throw new NotFoundException(`job with id ${jobId} not found`)
    }

    if (job.runnerId && job.runnerId !== runner.id) {
      throw new ForbiddenException(`job with id ${jobId} is not assigned to runner ${runner.id}`)
    }

    if (job.canceled()) {
      return job
    }

    try {
      await this.writeLogs(job, trace)
    } catch (e) {
      this.logger.error(e as Error, { phase: 'write logs' })
    }
    if (done) {
      await this.jobDone(jobId, duration!)
    }

    return job
  }

  async getJobLog(job: Job, after = -1) {
    try {
      const logs = await this.getStoredLogs(job)
      if (after > 0) {
        return logs.slice(after + 1)
      }
      return logs
    } catch (e) {
      throw new UserError('Job trace has expired.')
    }
  }

  async writeLogs(job: Job, logs: JobLog[]) {
    if (!logs.length) {
      return -1
    }

    let fullLogs = logs

    const precedingLogs = await this.getStoredLogs(job).catch(() => [])
    if (precedingLogs.length) {
      const lastTime = precedingLogs[precedingLogs.length - 1][1]
      fullLogs = [...precedingLogs, ...logs.filter((log) => log[1] > lastTime)]
    }

    await this.logStorage.upload(getLogStorageKey(job), Buffer.from(JSON.stringify(fullLogs), 'utf-8')).catch((e) => {
      this.logger.error(e, { phase: 'upload job log' })
    })

    return fullLogs[fullLogs.length - 1][1]!
  }

  async getRunnerRunningJobs(runner: Runner) {
    return Job.findBy({
      runnerId: runner.id,
      status: JobStatus.Running,
    })
  }

  async getRunnerRunningJobsCount(runner: Runner) {
    const result = await this.runnerRunningJobCountLoader.load(runner.id)
    return result?.count ?? 0
  }

  async filterJobsByEndTime(projectId: number, { from, to }: TimeUsageInput) {
    return Job.findBy({
      projectId,
      endedAt: Between(from, to),
    })
  }

  private async getStoredLogs(job: Job): Promise<JobLog[]> {
    const buf = await this.logStorage.get(getLogStorageKey(job))
    return JSON.parse(buf.toString())
  }

  private async createJob(event: CreateJobEvent) {
    const {
      payload: { entityId, projectId },
      type,
      zone,
    } = event

    if (!this.jobPayloadGetters.has(type)) {
      this.logger.error(new Error(`Non related job type bound to event type: ${type}`), { phase: 'create job' })
    }

    return Job.create({
      jobType: type,
      iid: await this.internalId.generate(projectId, InternalIdUsage.Job),
      projectId: projectId,
      entityId,
      zone: zone ?? (await ApplicationSetting.defaultJobZone()),
      extra: 'extra' in event.payload ? event.payload.extra : undefined,
    })
  }

  private async recordJobCount(jobs: Job[]) {
    const counts = countBy(jobs, 'projectId')

    for (const [projectId, count] of Object.entries(counts)) {
      await this.projectUsage.recordJobCountUsage(Number(projectId), count)
    }
  }

  private recordJobCreating(jobs: Job[]) {
    const date = new Date()
    date.setUTCHours(0, 0, 0, 0)
    jobs.forEach((job) => {
      this.metrics.jobCreate(1, {
        jobType: job.jobType,
      })
    })
  }

  private async getLatestDoneJobId(type: JobType, zone: string) {
    return this.redis
      .get(`${LATEST_DONE_JOB_KEY}_${zone}_${type}`)
      .then((idString) => {
        if (idString) {
          return parseInt(idString)
        }
        return 0
      })
      .catch(() => 0)
  }

  private async setLatestDoneJobId(type: JobType, zone: string, id: number) {
    await this.redis.set(`${LATEST_DONE_JOB_KEY}_${zone}_${type}`, id)
  }

  private async getEntityRealId(jobType: JobType, entityId: number, projectId: number) {
    switch (jobType) {
      case JobType.BundleAnalyze:
        const artifact = await Artifact.findOneBy({ projectId, iid: entityId })
        return artifact?.id
      case JobType.LabAnalyze:
      case JobType.E2EAnalyze:
        const snapshotReport = await SnapshotReport.findOneBy({ projectId, iid: entityId })
        return snapshotReport?.id
      case JobType.SourceAnalyze:
        const sourceSnapshotReport = await SnapshotReport.findOneBy({ projectId, iid: entityId })
        return sourceSnapshotReport?.id
      case JobType.LabPing:
        return entityId
      default:
        return null
    }
  }
}
