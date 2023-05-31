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
import { Between, FindOptionsWhere, In } from 'typeorm'

import {
  Artifact,
  DBService,
  InternalIdUsage,
  Job,
  JobStatus,
  PendingJob,
  Runner,
  SnapshotReport,
} from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { EventEmitter, OnEvent } from '@perfsee/platform-server/event'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { JobLogStorage } from '@perfsee/platform-server/storage'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { CreateJobEvent, JobType, UNKNOWN_RUNNER_ZONE, UpdateJobTraceParams } from '@perfsee/server-common'
import { JobLog, JobLogLevel } from '@perfsee/shared'

import { ApplicationSettingService } from '../application-setting'
import { ProjectUsageService } from '../project-usage/service'

import { TimeUsageInput } from './types'

// @ts-expect-error by design
const JOB_GROUPS: Record<JobType, JobType[]> = {
  [JobType.BundleAnalyze]: [JobType.BundleAnalyze],
  [JobType.LabAnalyze]: [JobType.LabAnalyze, JobType.E2EAnalyze, JobType.LabPing],
  [JobType.SourceAnalyze]: [JobType.SourceAnalyze],
  [JobType.PackageAnalyze]: [JobType.PackageAnalyze],
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
  [JobType.SourceAnalyze]: 3,
  [JobType.PackageAnalyze]: 1,
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
    private readonly logStorage: JobLogStorage,
    private readonly projectUsage: ProjectUsageService,
    private readonly db: DBService,
    private readonly setting: ApplicationSettingService,
    private readonly event: EventEmitter,
  ) {}

  @OnEvent('job.create')
  async createJobs(events: CreateJobEvent | CreateJobEvent[]) {
    if (!Array.isArray(events)) {
      events = [events]
    }

    const jobs = await Promise.all(
      events.map(async (event) => {
        try {
          return await this.createJob(event)
        } catch (e) {
          this.logger.error(e, { phase: 'create job' })
          return null
        }
      }),
    ).then((results) => results.filter(Boolean) as Job[])

    await this.recordProjectJobCountUsage(jobs)
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

  async requestJob(runner: Runner) {
    const endTimer = this.metrics.jobRequestTimer({ jobType: runner.jobType })
    const pendingJobs = await this.getPendingJobs(runner)

    for (const pendingJob of pendingJobs) {
      const acquired = await this.assignRunner(pendingJob, runner)
      if (acquired) {
        const payload = await this.getJobPayload(pendingJob)

        if (!payload) {
          this.event.emit(`${pendingJob.jobType}.error`, pendingJob.entityId, 'Fail to fetch job payload.')
          this.metrics.jobFail(1, { jobType: pendingJob.jobType })
          continue
        }

        endTimer()
        pendingJob.payload = payload
        return pendingJob
      }
    }

    endTimer()
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
        this.metrics.jobSuccess(1, { jobType: job.jobType })
      }
    }
  }

  async updateJobTrace({ jobId, trace, done, duration, failedReason }: UpdateJobTraceParams, runner: Runner) {
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
      await this.jobDone(jobId, duration!, !!failedReason)
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

    const settings = await this.setting.current()
    const iid = await this.internalId.generate(projectId, InternalIdUsage.Job)
    const jobZone = zone ?? settings.defaultJobZone
    const job = Job.create({
      jobType: type,
      projectId,
      iid,
      entityId,
      zone: jobZone,
      extra: 'extra' in event.payload ? event.payload.extra : undefined,
    })

    return this.db.transaction(async (manager) => {
      await manager.save(job)
      await manager.save(
        PendingJob.create({
          jobId: job.id,
          zone: jobZone,
          jobType: type,
        }),
      )
      return job
    })
  }

  private async recordProjectJobCountUsage(jobs: Job[]) {
    const counts = countBy(jobs, 'projectId')

    for (const [projectId, count] of Object.entries(counts)) {
      await this.projectUsage.recordJobCountUsage(Number(projectId), count)
    }
  }

  private recordJobCreating(jobs: Job[]) {
    jobs.forEach((job) => {
      this.metrics.jobCreate(1, {
        jobType: job.jobType,
      })
    })
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

  private async getPendingJobs(runner: Runner) {
    const filter: FindOptionsWhere<Job | PendingJob> = {}
    if (runner.zone !== UNKNOWN_RUNNER_ZONE) {
      filter.zone = runner.zone
    }

    if (runner.jobType !== JobType.All) {
      const types = getJobTypeGroup(runner.jobType)
      if (types.length === 1) {
        filter.jobType = types[0]
      } else if (types.length > 1) {
        filter.jobType = In(types)
      } else {
        filter.jobType = runner.jobType
      }
    }

    const settings = await this.setting.current()

    if (settings.usePendingJobTable) {
      const pendingJobs = await PendingJob.find({ where: filter, take: 20, order: { id: 'ASC' } })

      if (pendingJobs.length) {
        return Job.findBy({
          id: In(pendingJobs.map(({ jobId }) => jobId)),
        })
      }

      return []
    }

    return Job.find({
      where: { ...filter, status: JobStatus.Pending },
      take: 20,
      order: { id: 'ASC' },
    })
  }

  private async assignRunner(job: Job, runner: Runner) {
    const startedAt = new Date()
    const result = await Job.update(
      { id: job.id, status: JobStatus.Pending },
      { runnerId: runner.id, status: JobStatus.Running, startedAt },
    )

    // we add `status: pending` in update query
    // so that if the job is not pending, it will not be updated,
    // which means it was assigned to other runner right before.
    if (!result.affected) {
      return false
    }

    try {
      await PendingJob.delete({ jobId: job.id })
    } catch (e) {
      this.logger.error(e, { phase: 'delete pending job' })
    }

    this.metrics.jobPendingTime(startedAt.getTime() - job.createdAt.getTime(), { jobType: job.jobType })

    return true
  }
}
