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
import { EntityManager, FindOptionsWhere, In } from 'typeorm'

import {
  Artifact,
  Environment,
  Page,
  PageWithCompetitor,
  PageWithEnv,
  Profile,
  Snapshot,
  SnapshotReport,
  SnapshotReportWithArtifact,
  SourceIssue,
} from '@perfsee/platform-server/db'
import { Logger } from '@perfsee/platform-server/logger'
import { createDataLoader } from '@perfsee/platform-server/utils'
import { SnapshotStatus } from '@perfsee/server-common'

import { SnapshotReportFilter } from './types'

@Injectable()
export class SnapshotReportService {
  loader = createDataLoader((ids: number[]) => SnapshotReport.findBy({ id: In(ids) }))
  snapshotLoader = createDataLoader((ids: number[]) => Snapshot.findBy({ id: In(ids) }))

  constructor(private readonly logger: Logger) {}

  getReportsByIids(projectId: number, iids: number[]) {
    return SnapshotReport.createQueryBuilder('report')
      .where('report.iid in (:...iids)', { iids })
      .andWhere('report.project_id = :projectId', { projectId })
      .getMany()
  }

  async getReportsByCommitHash(projectId: number, hash: string) {
    const snapshotIds = await Snapshot.createQueryBuilder()
      .where('project_id = :projectId', { projectId })
      .andWhere('hash = :hash', { hash })
      .select('id')
      .getRawMany<{ id: number }>()
      .then((rows) => rows.map(({ id }) => id))

    if (!snapshotIds.length) {
      return []
    }
    return this.getReportsBySnapshotIds(snapshotIds)
  }

  async getReportByIid(projectId: number, iid: number) {
    return SnapshotReport.findOneBy({ projectId, iid })
  }

  async getSnapshotReportArtifacts(snapshotReportId: number) {
    return Artifact.createQueryBuilder('artifact')
      .innerJoin(SnapshotReportWithArtifact, 'item', 'artifact.id = item.artifact_id')
      .where('item.snapshot_report_id = :report_id', { report_id: snapshotReportId })
      .getMany()
  }

  async filterReports(projectId: number, filter: SnapshotReportFilter) {
    filter.to = filter.to ?? new Date()

    const qb = SnapshotReport.createQueryBuilder('report')
      .where('project_id = :projectId', { projectId })
      .andWhere('created_at <= :to', { to: filter.to })
      .andWhere('status = :status', { status: SnapshotStatus.Completed })

    if (!filter.length) {
      qb.andWhere('created_at >= :from', {
        from: filter.from ?? new Date(filter.to.getTime() - 1000 * 60 * 60 * 24 * 7 /* 7 days */),
      })
    } else {
      qb.take(filter.length)
    }

    const [pageId, envId, profileId] = await Promise.all([
      filter.pageIid ? this.getPageId(projectId, filter.pageIid) : Promise.resolve(null),
      filter.envIid ? this.getEnvId(projectId, filter.envIid) : Promise.resolve(null),
      filter.profileIid ? this.getProfileId(projectId, filter.profileIid) : Promise.resolve(null),
    ])

    const pageIds = pageId && filter.withCompetitor ? [pageId] : []

    if (pageId) {
      if (filter.withCompetitor) {
        const competitorIds = await PageWithCompetitor.createQueryBuilder()
          .select('competitor_id as competitorId')
          .where('page_id = :pageId', { pageId })
          .getRawMany<{ competitorId: number }>()
          .then((rows) => rows.map(({ competitorId }) => competitorId))

        pageIds.push(...competitorIds)
        qb.andWhere('page_id in (:...pageIds)', { pageIds })
      } else {
        qb.andWhere('page_id = :pageId', { pageId })
      }
    }

    if (envId) {
      if (filter.withCompetitor) {
        const envIds = await PageWithEnv.createQueryBuilder()
          .select('env_id as envId')
          .where('page_id in (:...pageIds)', { pageIds })
          .getRawMany<{ envId: number }>()
          .then((rows) => rows.map(({ envId }) => envId))
        qb.andWhere('env_id in (:...envIds)', { envIds })
      } else {
        qb.andWhere('env_id = :envId', { envId })
      }
    }

    if (profileId) {
      qb.andWhere('profile_id = :profileId', { profileId })
    }

    return qb.orderBy('created_at', 'DESC').getMany()
  }

  async getReportsBySnapshotId(snapshotId: number) {
    return SnapshotReport.createQueryBuilder('report')
      .where('report.snapshotId = :snapshotId', { snapshotId })
      .getMany()
  }

  async getReportsBySnapshotIds(snapshotIds: number[]) {
    return SnapshotReport.createQueryBuilder('report')
      .where('report.snapshot_id in (:...snapshotIds)', { snapshotIds })
      .getMany()
  }

  async getNonCompetitorReports(projectId: number, snapshotId: number) {
    const pageIds = await Page.findBy({ projectId, isCompetitor: false, isTemp: false }).then((pages) =>
      pages.map((page) => page.id),
    )

    if (!pageIds.length) {
      return []
    }

    return SnapshotReport.createQueryBuilder()
      .where('snapshot_id = :snapshotId', { snapshotId })
      .andWhere('page_id in (:...pageIds)', { pageIds })
      .getMany()
  }

  /**
   * delete all stuff in a transaction
   */
  async deleteSnapshotsReports(manager: EntityManager, conditions: FindOptionsWhere<SnapshotReport>) {
    const reports = await SnapshotReport.findBy(conditions)
    const reportIds = reports.map(({ id }) => id)

    this.logger.log('start delete snapshot report', { conditions, count: reportIds.length })

    // delete reports slowly in case too many reports
    for (let i = 0; i < Math.ceil(reportIds.length / 30); i++) {
      const ids = reportIds.slice(i * 30, (i + 1) * 30)
      await manager.getRepository(SnapshotReport).delete(ids)
      await manager.getRepository(SourceIssue).delete({ snapshotReportId: In(ids) })
    }
  }

  async getIssuesBySnapshotReportId(reportId: number) {
    return SourceIssue.createQueryBuilder().where('snapshot_report_id = :reportId', { reportId }).getMany()
  }

  getSnapshot(id: number) {
    return Snapshot.findOneBy({ id })
  }

  getPageIds(projectId: number, iids: number[]) {
    return Page.createQueryBuilder()
      .where('project_id = :projectId')
      .andWhere('iid in (:...iids)')
      .select('id')
      .setParameters({
        projectId: projectId,
        iids,
      })
      .getRawMany<{ id: number }>()
      .then((rows) => rows.map(({ id }) => id))
  }

  getProfileIds(projectId: number, iids: number[]) {
    return Profile.createQueryBuilder()
      .where('project_id = :projectId')
      .andWhere('iid in (:...iids)')
      .select('id')
      .setParameters({
        projectId: projectId,
        iids,
      })
      .getRawMany<{ id: number }>()
      .then((rows) => rows.map(({ id }) => id))
  }

  getEnvIds(projectId: number, iids: number[]) {
    return Environment.createQueryBuilder()
      .where('project_id = :projectId')
      .andWhere('iid in (:...iids)')
      .select('id')
      .setParameters({
        projectId: projectId,
        iids,
      })
      .getRawMany<{ id: number }>()
      .then((rows) => rows.map(({ id }) => id))
  }

  async getEnvId(projectId: number, iid: number) {
    const env = await Environment.findOneByOrFail({ projectId, iid })
    return env.id
  }

  async getProfileId(projectId: number, iid: number) {
    const profile = await Profile.findOneByOrFail({ iid, projectId })
    return profile.id
  }

  async getPageId(projectId: number, iid: number) {
    const page = await Page.findOneByOrFail({ iid, projectId })
    return page.id
  }
}
