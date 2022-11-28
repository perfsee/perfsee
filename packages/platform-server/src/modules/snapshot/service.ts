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

import { BadRequestException, HttpException, HttpStatus, Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { In } from 'typeorm'

import {
  SnapshotReport,
  Environment,
  Page,
  Snapshot,
  InternalIdUsage,
  DBService,
  Project,
  Profile,
  SnapshotTrigger,
  AppVersion,
  PageWithProfile,
  PageWithEnv,
} from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { EventEmitter, OnEvent } from '@perfsee/platform-server/event'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { Redis } from '@perfsee/platform-server/redis'
import {
  JobType,
  LabJobPayload,
  SnapshotStatus,
  LabJobResult,
  E2EJobResult,
  PingJobResult,
  PingJobPayload,
  CreateJobEvent,
} from '@perfsee/server-common'

import { getLighthouseRunData, createDataLoader, getLabPingData } from '../../utils'
import { AppVersionService } from '../app-version/service'
import { CheckSuiteService } from '../checksuite/service'
import { NotificationService } from '../notification/service'
import { PageService } from '../page/service'
import { ProjectUsageService } from '../project-usage/service'
import { SourceService } from '../source/service'

import { SnapshotReportService } from './snapshot-report/service'

@Injectable()
export class SnapshotService implements OnApplicationBootstrap {
  loader = createDataLoader(
    (ids: number[]) => Snapshot.createQueryBuilder('snapshot').where('snapshot.id in (:...ids)', { ids }).getMany(),
    'id',
  )

  constructor(
    private readonly db: DBService,
    private readonly reportService: SnapshotReportService,
    private readonly pageService: PageService,
    private readonly logger: Logger,
    private readonly metrics: Metric,
    private readonly internalIdService: InternalIdService,
    private readonly event: EventEmitter,
    private readonly source: SourceService,
    private readonly checkSuite: CheckSuiteService,
    private readonly notification: NotificationService,
    private readonly appVersion: AppVersionService,
    private readonly redis: Redis,
    private readonly projectUsage: ProjectUsageService,
  ) {}

  onApplicationBootstrap() {
    const payloadGetter = this.getReportJobPayload.bind(this)
    const pingPayloadGetter = this.getPingJobPayload.bind(this)

    this.event.emit('job.register_payload_getter', JobType.LabAnalyze, payloadGetter)
    this.event.emit('job.register_payload_getter', JobType.E2EAnalyze, payloadGetter)
    this.event.emit('job.register_payload_getter', JobType.LabPing, pingPayloadGetter)
  }

  async getSnapshots(
    projectId: number,
    { first, after, skip }: PaginationInput,
    trigger?: SnapshotTrigger,
    hash?: string,
    hashRequired?: boolean,
  ) {
    const qb = Snapshot.createQueryBuilder('snapshot')
      .where('snapshot.project_id = :projectId', { projectId })
      .orderBy('snapshot.id', 'DESC')
      .skip(skip)
      .take(first ?? 10)

    if (hashRequired) {
      qb.andWhere('snapshot.hash is not null')
    }

    if (after) {
      qb.andWhere('snapshot.id < :after', { after })
    }

    if (trigger) {
      qb.andWhere('snapshot.trigger = :trigger', { trigger })
    }

    if (hash) {
      qb.andWhere('snapshot.hash = :hash', { hash })
    }

    return qb.getManyAndCount()
  }

  async getSnapshot(projectId: number, iid: number) {
    return Snapshot.findOneBy({ projectId, iid })
  }

  async getSnapshotByCommit(projectId: number, hash: string) {
    return Snapshot.createQueryBuilder()
      .where('project_id = :projectId', { projectId })
      .andWhere('hash = :hash', { hash })
      .getOne()
  }

  async takeTempSnapshot(
    projectId: number,
    issuer: string,
    url: string,
    profileIids: number[],
    envIid: number,
    title?: string,
  ) {
    await this.projectUsage.verifyUsageLimit(projectId)

    const existed = await Page.findOneBy({ url, projectId })

    const page = await Page.create({
      id: existed?.id,
      iid: existed?.iid ?? (await this.internalIdService.generate(projectId, InternalIdUsage.Page)),
      url,
      name: url,
      projectId,
      isTemp: true,
    }).save()

    const env = await Environment.findOneBy({ projectId, iid: envIid })
    if (!env) {
      throw new UserError('Environment not found')
    }
    const profiles = await Profile.findBy({ projectId, iid: In(profileIids) })

    const propertyIds = profiles.map(({ id }) => {
      return {
        pageId: page.id,
        profileId: id,
        envId: env.id,
      }
    })

    const snapshot = await Snapshot.create({
      iid: await this.internalIdService.generate(projectId, InternalIdUsage.Snapshot),
      status: SnapshotStatus.Pending,
      projectId,
      issuer,
      title,
    }).save()

    const reports = await this.createReports(snapshot.projectId, snapshot.id, propertyIds)

    try {
      await this.emitLabJobs(projectId, reports, { pages: [page], envs: [env], profiles })
    } catch (err) {
      throw new HttpException((err as Error).message, HttpStatus.BAD_REQUEST)
    }

    return snapshot
  }

  async takeSnapshot(
    options: {
      projectId: number
      hash?: string
      issuer?: string
      trigger?: SnapshotTrigger
      pageIids?: number[]
      profileIids?: number[]
      envIids?: number[]
      title?: string
    },
    alwaysCreate?: boolean,
  ) {
    const { projectId, pageIids, issuer, profileIids, envIids, title, trigger, hash } = options
    const project = await Project.findOneByOrFail({ id: projectId })

    await this.projectUsage.verifyUsageLimit(projectId)

    const { pages, envs, profiles, propertyIds } = await this.pageService.getPageWithProperty(
      projectId,
      pageIids,
      profileIids,
      envIids,
    )

    const noReports = !propertyIds.length

    if (noReports && !alwaysCreate) {
      throw new Error('No report created with given configuration.')
    }

    const failed = noReports && alwaysCreate

    const iid = await this.internalIdService.generate(projectId, InternalIdUsage.Snapshot)

    const snapshot = await Snapshot.create({
      iid,
      status: failed ? SnapshotStatus.Failed : SnapshotStatus.Pending,
      project,
      issuer,
      failedReason: failed ? 'No reports' : undefined,
      title,
      trigger,
      hash,
    }).save()

    if (failed) {
      return snapshot
    }

    const reports = await this.createReports(snapshot.projectId, snapshot.id, propertyIds)

    try {
      await this.emitLabJobs(snapshot.projectId, reports, { pages, envs, profiles })
    } catch (e) {
      this.logger.error(e as Error, { phase: 'Dispatch snapshot jobs' })
    }

    if (hash) {
      await this.appVersion.recordVersion({
        projectId,
        snapshotId: snapshot.id,
        hash,
      })

      await this.checkSuite.startLabCheck(project, snapshot)
    }

    return snapshot
  }

  async pingConnection(options: { projectId: number; pageIid: number; profileIid?: number; envIid?: number }) {
    const { projectId, pageIid, profileIid, envIid } = options

    const page = await Page.findOneByOrFail({ iid: pageIid, projectId })
    try {
      // single one
      if (profileIid && envIid) {
        const profile = await Profile.findOneByOrFail({ iid: profileIid, projectId })
        const env = await Environment.findOneByOrFail({ iid: envIid, projectId })
        await this.emitPingJobs(projectId, page.id, [profile], [env])
      } else {
        const pageWithProfile = await PageWithProfile.findBy({ pageId: page.id })
        const pageWithEnv = await PageWithEnv.findBy({ pageId: page.id })
        const envs = await Environment.findBy({ id: In(pageWithEnv.map(({ envId }) => envId)) })
        const profiles = await Profile.findBy({ id: In(pageWithProfile.map(({ profileId }) => profileId)) })
        await this.emitPingJobs(projectId, page.id, profiles, envs)
      }
    } catch (e) {
      this.logger.error(e as Error, { phase: 'ping connection' })
      return false
    }

    return true
  }

  async dispatchReport(report: SnapshotReport) {
    const page = await Page.findOneByOrFail({ id: report.pageId })
    const env = await Environment.findOneByOrFail({ id: report.envId })
    await SnapshotReport.update(report.id, { status: SnapshotStatus.Pending })

    await this.event.emitAsync('job.create', {
      type: page.isE2e ? JobType.E2EAnalyze : JobType.LabAnalyze,
      payload: {
        entityId: report.id,
        projectId: page.projectId,
      },
      zone: env.zone,
    })
  }

  async deleteSnapshotById(projectId: number, iid: number) {
    const snapshot = await Snapshot.findOneByOrFail({ iid, projectId })
    const { id } = snapshot

    await this.db.transaction(async (manager) => {
      await manager.getRepository(AppVersion).delete({ snapshotId: id })
      await this.reportService.deleteSnapshotsReports(manager, { snapshotId: id })
      await manager.remove(snapshot)
    })
  }

  async getReportJobPayload(reportId: number): Promise<LabJobPayload> {
    const report = await this.reportService.loader.load(reportId)

    const { pages, profiles, envs } = await this.getAllProperties([report.projectId])

    return getLighthouseRunData(pages, profiles, envs, [report])[0]
  }

  async getPingJobPayload(_pageId: number, extra: { key: string }): Promise<PingJobPayload> {
    const [pageId, profileId, envId] = extra.key.split('-')
    const page = await Page.findOneByOrFail({ id: parseInt(pageId) })
    const profile = await Profile.findOneByOrFail({ id: parseInt(profileId) })
    const env = await Environment.findOneByOrFail({ id: parseInt(envId) })

    return getLabPingData(page, profile, env)
  }

  async getAllProperties(projectIds: number[]) {
    const pagesQuery = Page.createQueryBuilder().where('project_id in (:...projectIds)', { projectIds }).getMany()
    const profilesQuery = Profile.createQueryBuilder('profile')
      .where('project_id in (:...projectIds)', { projectIds })
      .getMany()
    const envsQuery = Environment.createQueryBuilder().where('project_id in (:...projectIds)', { projectIds }).getMany()

    const [pages, profiles, envs] = await Promise.all([pagesQuery, profilesQuery, envsQuery])

    return { pages, profiles, envs }
  }

  async emitLabJobs(
    projectId: number,
    reports: SnapshotReport[],
    { pages, envs }: { pages: Page[]; envs: Environment[]; profiles: Profile[] },
  ) {
    const pageMap = new Map(pages.map((page) => [page.id, page]))
    const envMap = new Map(envs.map((env) => [env.id, env]))

    if (reports.length) {
      await this.event.emitAsync(
        'job.create',
        reports.map(({ id, pageId, envId }) => ({
          type: pageMap.get(pageId)!.isE2e ? JobType.E2EAnalyze : JobType.LabAnalyze,
          payload: {
            entityId: id,
            projectId,
          },
          zone: envMap.get(envId)!.zone,
        })),
      )
    }
  }

  async emitPingJobs(projectId: number, pageId: number, profiles: Profile[], envs: Environment[]) {
    const payloads: CreateJobEvent<JobType.LabPing>[] = []

    for (const profile of profiles) {
      for (const env of envs) {
        const key = `${pageId}-${profile.id}-${env.id}`
        await this.redis.set(key, 'pending', 'EX', /* 7 days */ 3600 * 7 * 24)

        payloads.push({
          type: JobType.LabPing,
          payload: {
            entityId: pageId,
            extra: {
              key,
            },
            projectId,
          },
          zone: env.zone,
        })
      }
    }

    await this.event.emitAsync('job.create', payloads)
  }

  // Update report -> try completed -> start source analyze -> send notification
  async updateLabReport(data: LabJobResult) {
    const { snapshotReport } = data
    const report = await this.updateSnapshotReport(snapshotReport)

    if (report && (report.status === SnapshotStatus.Completed || report.status === SnapshotStatus.Failed)) {
      const completed = await this.tryCompleteSnapshot(report.snapshotId)
      if (completed) {
        const snapshot = await Snapshot.findOneByOrFail({ id: report.snapshotId })
        const reports = await SnapshotReport.createQueryBuilder('report')
          .leftJoinAndSelect('report.page', 'page', 'page.id = report.page_id')
          .leftJoinAndSelect('report.profile', 'profile', 'profile.id = report.profile_id')
          .where('report.snapshot_id = :snapshotId', { snapshotId: report.snapshotId })
          .getMany()
        const project = await Project.findOneByOrFail({ id: snapshot.projectId })
        await this.sendLabNotification(snapshot, reports)
        await this.checkSuite.endLabCheck(project, snapshot, reports)
      }
    }
  }

  async sendLabNotification(snapshot: Snapshot, reports: SnapshotReport[]) {
    await this.notification
      .sendLabJobNotification(snapshot, reports)
      .then((targets) => {
        if (targets) {
          this.logger.verbose('Notification sent', { snapshotId: snapshot.id, targets })
        }
      })
      .catch((e) => {
        this.logger.error(e, { phase: 'notification' })
      })
  }

  async updateSnapshotReport(report: Partial<SnapshotReport> & { id: number }) {
    this.logger.verbose('Receive snapshot report update message', report)
    await SnapshotReport.update(report.id, report)
    const reportItem = await SnapshotReport.findOneByOrFail({ id: report.id })

    if (reportItem.status === SnapshotStatus.Completed) {
      this.metrics.snapshotReportComplete(1)
      this.source.startSourceIssueAnalyze([reportItem]).catch((e) => {
        this.logger.error(e, { phase: 'source analyze' })
      })
    } else if (report.status === SnapshotStatus.Failed) {
      this.metrics.snapshotReportFail(1)
    }

    this.logger.verbose('Snapshot report synced to DB', { reportId: report.id })

    try {
      await this.updateSnapshotStatus(reportItem.snapshotId)
    } catch (e) {
      this.logger.error(e as Error, { phase: 'update snapshot status' })
    }

    return reportItem
  }

  async tryCompleteSnapshot(snapshotId: number) {
    try {
      return await this.db.transaction(async (manager) => {
        const snapshot = await manager.getRepository(Snapshot).findOneBy({ id: snapshotId })

        if (!snapshot || snapshot.status === SnapshotStatus.Completed) {
          return false
        }

        const reports = await manager.getRepository(SnapshotReport).findBy({ snapshotId })

        if (!reports.length) {
          return false
        }

        const completedReports: SnapshotReport[] = []
        const failedReports: SnapshotReport[] = []

        reports.forEach((report) => {
          if (report.status === SnapshotStatus.Completed) {
            completedReports.push(report)
          } else if (report.status === SnapshotStatus.Failed) {
            failedReports.push(report)
          }
        })

        const finishedCount = completedReports.length + failedReports.length

        // all reports finished
        if (finishedCount === reports.length) {
          this.logger.verbose('complete snapshot', snapshot)
          snapshot.status = SnapshotStatus.Completed
          await snapshot.save()
          this.metrics.snapshotComplete(1)
          return true
        }
        return false
      })
    } catch (e) {
      this.logger.error(e as Error, { phase: 'complete snapshot' })
      this.metrics.snapshotFail(1)
      await Snapshot.update(snapshotId, {
        status: SnapshotStatus.Failed,
        failedReason: (e as Error).message,
      })
      return false
    }
  }

  async setSnapshotHash(projectId: number, iid: number, hash: string) {
    const snapshot = await Snapshot.findOneByOrFail({
      projectId,
      iid,
    })

    if (snapshot.hash && snapshot.hash !== hash) {
      throw new BadRequestException('Snapshot hash already set')
    }

    snapshot.hash = hash
    await Snapshot.save(snapshot, { reload: false })

    await this.appVersion.recordVersion({
      projectId,
      snapshotId: snapshot.id,
      hash,
    })

    return snapshot
  }

  async getSnapshotCount(projectId: number) {
    return Snapshot.countBy({ projectId })
  }

  @OnEvent(`${JobType.LabAnalyze}.update`)
  async handleReportUpdate(data: LabJobResult) {
    await this.updateLabReport(data)
  }

  @OnEvent(`${JobType.E2EAnalyze}.update`)
  async handleE2EReportUpdate(data: E2EJobResult) {
    await this.updateLabReport(data)
  }

  @OnEvent(`${JobType.LabPing}.update`)
  async handlePingUpdate(data: PingJobResult) {
    await this.redis.set(data.key, data.status, 'EX', /* 7 days */ 3600 * 7 * 24)
  }

  @OnEvent(`${JobType.LabAnalyze}.error`)
  async handleReportFailure(reportId: number, reason: string) {
    await this.updateLabReport({
      snapshotReport: {
        id: reportId,
        status: SnapshotStatus.Failed,
        failedReason: reason,
      },
    })
  }

  @OnEvent(`${JobType.E2EAnalyze}.error`)
  async handleE2eFailure(reportId: number, reason: string) {
    await this.updateLabReport({
      snapshotReport: {
        id: reportId,
        status: SnapshotStatus.Failed,
        failedReason: reason,
      },
    })
  }

  @OnEvent(`${JobType.LabPing}.error`)
  handlePingFailure(pageId: number, reason: string) {
    this.logger.error(pageId, { phase: 'ping check failed', reason })
  }

  // Update to running
  private async updateSnapshotStatus(snapshotId: number) {
    const snapshot = await Snapshot.findOneBy({ id: snapshotId })
    if (!snapshot) {
      return
    }

    if (snapshot.status === SnapshotStatus.Scheduled || snapshot.status === SnapshotStatus.Pending) {
      await Snapshot.update(snapshot.id, {
        status: SnapshotStatus.Running,
        startedAt: new Date(),
      })

      const project = await Project.findOneByOrFail({ id: snapshot.projectId })
      await this.checkSuite.runLabCheck(project, snapshot)
    }
  }

  private async createReports(
    projectId: number,
    snapshotId: number,
    propertyIds: { pageId: number; profileId: number; envId: number }[],
  ) {
    const reports = []
    for (const item of propertyIds) {
      const iid = await this.internalIdService.generate(projectId, InternalIdUsage.SnapshotReport)
      const report = SnapshotReport.create({
        projectId,
        iid,
        snapshotId,
        pageId: item.pageId,
        profileId: item.profileId,
        status: SnapshotStatus.Pending,
        envId: item.envId,
      })
      reports.push(report)
    }

    return SnapshotReport.save(reports)
  }
}
