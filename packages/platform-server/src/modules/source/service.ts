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

import { Injectable, OnApplicationBootstrap } from '@nestjs/common'
import { uniqBy } from 'lodash'

import { Artifact, InternalIdUsage, Page, Snapshot, SnapshotReport, SourceIssue } from '@perfsee/platform-server/db'
import { EventEmitter } from '@perfsee/platform-server/event'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { JobType, SnapshotStatus, SourceAnalyzeJob } from '@perfsee/server-common'
import { FlameChartDiagnostic } from '@perfsee/shared'

import { SnapshotReportService } from '../snapshot/snapshot-report/service'

@Injectable()
export class SourceService implements OnApplicationBootstrap {
  constructor(
    private readonly reportService: SnapshotReportService,
    private readonly logger: Logger,
    private readonly internalIdService: InternalIdService,
    private readonly event: EventEmitter,
  ) {}

  onApplicationBootstrap() {
    this.event.emit('job.register_payload_getter', JobType.SourceAnalyze, this.getSourceJobPayload.bind(this))
  }

  async updateReportFlameChart(id: number, key: string) {
    await SnapshotReport.update(id, { flameChartStorageKey: key })
  }

  async updateReportSourceCoverage(id: number, key: string) {
    await SnapshotReport.update(id, { sourceCoverageStorageKey: key })
  }

  async saveSourceIssues(projectId: number, hash: string, reportId: number, issues: FlameChartDiagnostic[]) {
    const sourceIssues = []

    for (const issue of issues) {
      const iid = await this.internalIdService.generate(projectId, InternalIdUsage.SourceIssue)
      sourceIssues.push({
        projectId,
        iid,
        hash,
        snapshotReportId: reportId,
        frameKey: String(issue.frame.key),
        code: issue.code,
        info: issue.info,
      })
    }

    await SourceIssue.insert(sourceIssues)
  }

  async startSourceIssueAnalyze(snapshotOrId: number | Snapshot) {
    const snapshot = typeof snapshotOrId === 'number' ? await Snapshot.findOneBy({ id: snapshotOrId }) : snapshotOrId
    if (snapshot?.hash) {
      this.logger.verbose('Emit source code analyse', { snapshotId: snapshot.id })
      await this.event.emitAsync('job.create', {
        type: JobType.SourceAnalyze,
        payload: {
          entityId: snapshot.id,
          projectId: snapshot.projectId,
        },
      })
    }
  }

  async getSourceJobPayload(snapshotId: number): Promise<SourceAnalyzeJob | null> {
    const snapshot = await Snapshot.findOneBy({ id: snapshotId })
    if (!snapshot?.hash) {
      return null
    }

    const artifacts = await Artifact.find({
      where: {
        projectId: snapshot.projectId,
        hash: snapshot.hash,
      },
      order: {
        createdAt: 'DESC',
      },
    }).then((res) => uniqBy(res, 'name'))

    if (!artifacts.length) {
      return null
    }

    const reports = await this.reportService.getNonCompetitorReports(snapshot.projectId, snapshot.id).then((reports) =>
      Promise.all(
        reports
          .filter((report) => report.status === SnapshotStatus.Completed && report.traceEventsStorageKey)
          .map(async (report) => {
            const page = await Page.findOneByOrFail({ id: report.pageId })
            return {
              id: report.id,
              traceEventsStorageKey: report.traceEventsStorageKey!,
              jsCoverageStorageKey: report.jsCoverageStorageKey!,
              pageUrl: page.url,
            }
          }),
      ),
    )

    if (!reports.length) {
      return null
    }

    return {
      snapshotId,
      projectId: snapshot.projectId,
      hash: snapshot.hash,
      artifacts: artifacts.map((artifact) => artifact.buildKey),
      snapshotReports: reports,
    }
  }

  async getSourceIssues(projectId: number, { first, after, skip }: PaginationInput, hash?: string) {
    const qb = SourceIssue.createQueryBuilder('issue')
      .where('issue.project_id = :projectId', { projectId })
      .orderBy('id', 'DESC')
      .skip(skip)
      .take(first ?? 10)

    if (after) {
      qb.andWhere('issue.id < :after', { after })
    }

    if (hash) {
      qb.andWhere('hash = :hash', { hash })
    }

    return qb.getManyAndCount()
  }

  async getCommitsThatHaveIssues(projectId: number) {
    const commits = await SourceIssue.createQueryBuilder()
      .select('hash')
      .distinct()
      .where('project_id = :projectId', { projectId })
      .andWhere('created_at >= DATE_SUB(NOW(), INTERVAL 3 MONTH)') // simply ignore the issues created before 3 months ago.
      .getRawMany<{ hash: string }>()
      .then((rows) => rows.map(({ hash }) => hash))

    return commits.reverse()
  }

  async getIssueByIid(projectId: number, issueIid: number) {
    return SourceIssue.createQueryBuilder()
      .where('iid = :iid', { iid: issueIid })
      .andWhere('project_id = :projectId', { projectId })
      .getOne()
  }
}
