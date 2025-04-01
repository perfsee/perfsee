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
import { In } from 'typeorm'

import {
  Artifact,
  InternalIdUsage,
  Page,
  Project,
  Snapshot,
  SnapshotReport,
  SnapshotReportWithArtifact,
  SourceIssue,
} from '@perfsee/platform-server/db'
import { EventEmitter } from '@perfsee/platform-server/event'
import { AnalyzeUpdateType } from '@perfsee/platform-server/event/type'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { JobType, SourceAnalyzeJob, SourceAnalyzeJobResult, SourceStatus } from '@perfsee/server-common'
import { FlameChartDiagnostic, LHStoredSchema } from '@perfsee/shared'

import { ProjectUsageService } from '../project-usage/service'
import { ScriptFileService } from '../script-file/service'
import { SnapshotReportService } from '../snapshot/snapshot-report/service'

@Injectable()
export class SourceService implements OnApplicationBootstrap {
  constructor(
    private readonly logger: Logger,
    private readonly internalIdService: InternalIdService,
    private readonly scriptFile: ScriptFileService,
    private readonly objectStorage: ObjectStorage,
    private readonly event: EventEmitter,
    private readonly reportService: SnapshotReportService,
    private readonly projectUsage: ProjectUsageService,
  ) {}

  onApplicationBootstrap() {
    this.event.emit('job.register_payload_getter', JobType.SourceAnalyze, this.getSourceJobPayload.bind(this))
  }

  async completeSource({
    projectId,
    reportId,
    artifactIds,
    diagnostics,
    flameChartStorageKey,
    sourceCoverageStorageKey,
    statisticsStorageKey,
    reactProfileStorageKey,
    lighthouseStorageKey,
    traceDataStorageKey,
    requestsStorageKey,
  }: Extract<SourceAnalyzeJobResult, { status: SourceStatus.Completed }>) {
    await this.updateReport(
      reportId,
      artifactIds,
      flameChartStorageKey,
      sourceCoverageStorageKey,
      statisticsStorageKey,
      reactProfileStorageKey,
      lighthouseStorageKey,
      traceDataStorageKey,
      requestsStorageKey,
    )
    await this.saveSourceIssues(projectId, reportId, diagnostics)
    const project = await Project.findOneByOrFail({ id: projectId })
    const snapshotReport = await SnapshotReport.findOneByOrFail({ id: reportId })
    this.event.emit(`${AnalyzeUpdateType.SourceUpdate}.completed`, {
      project,
      report: snapshotReport,
    })
  }

  async updateReport(
    id: number,
    artifactIds: number[],
    flameChartStorageKey: string,
    sourceCoverageStorageKey: string | undefined,
    statisticsStorageKey: string | undefined,
    reactProfileStorageKey: string | undefined,
    lighthouseStorageKey: string,
    traceDataStorageKey: string | undefined,
    requestsStorageKey: string | undefined,
  ) {
    await SnapshotReport.update(id, {
      sourceCoverageStorageKey,
      flameChartStorageKey,
      sourceAnalyzeStatisticsStorageKey: statisticsStorageKey,
      reactProfileStorageKey,
      lighthouseStorageKey,
      traceDataStorageKey,
      requestsStorageKey,
    })
    await SnapshotReportWithArtifact.insert(artifactIds.map((artifactId) => ({ snapshotReportId: id, artifactId })))
  }

  async updateReportSourceStatus(id: number | number[], status: SourceStatus) {
    await SnapshotReport.update(id, {
      sourceStatus: status,
    })
  }

  async saveSourceIssues(projectId: number, reportId: number, issues: FlameChartDiagnostic[]) {
    const sourceIssues = []

    for (const issue of issues) {
      if (!issue.bundleHash) {
        continue
      }

      const iid = await this.internalIdService.generate(projectId, InternalIdUsage.SourceIssue)
      sourceIssues.push({
        projectId,
        iid,
        hash: issue.bundleHash,
        snapshotReportId: reportId,
        frameKey: String(issue.frame.key),
        code: issue.code,
        info: issue.info,
      })
    }

    await SourceIssue.insert(sourceIssues)
  }

  async startSourceIssueAnalyze(snapshotReports: SnapshotReport[]) {
    if (!snapshotReports.length) {
      return
    }

    this.logger.verbose('Emit source code analyser', { snapshotReportIds: snapshotReports.map((report) => report.id) })
    // we always trigger source analysis with same project
    // so it's safe
    await this.projectUsage.recordJobCountUsage(snapshotReports[0].projectId, snapshotReports.length)

    await this.updateReportSourceStatus(
      snapshotReports.map((s) => s.id),
      SourceStatus.Pending,
    )

    await this.event.emitAsync(
      'job.create',
      snapshotReports.map((snapshotReport) => ({
        type: JobType.SourceAnalyze,
        payload: {
          entityId: snapshotReport.id,
          projectId: snapshotReport.projectId,
        },
      })),
    )
  }

  async getSourceJobPayload(snapshotReportId: number): Promise<SourceAnalyzeJob> {
    const snapshotReport = await SnapshotReport.findOneByOrFail({ id: snapshotReportId })
    const snapshot = await Snapshot.findOneByOrFail({ id: snapshotReport.snapshotId })

    if (!snapshotReport.traceEventsStorageKey) {
      throw new Error('Snapshot report has no traceEventsStorageKey')
    }

    if (!snapshotReport.jsCoverageStorageKey) {
      throw new Error('Snapshot report has no jsCoverageStorageKey')
    }

    if (!snapshotReport.lighthouseStorageKey) {
      throw new Error('Snapshot report has no lighthouseStorageKey')
    }

    const artifacts = []

    if (snapshot.hash) {
      artifacts.push(
        ...(await Artifact.find({
          where: {
            projectId: snapshot.projectId,
            hash: snapshot.hash,
          },
          order: {
            createdAt: 'DESC',
          },
        }).then((res) => uniqBy(res, 'name'))),
      )
    }

    const lighthouseResult = JSON.parse(
      (await this.objectStorage.get(snapshotReport.lighthouseStorageKey)).toString('utf-8'),
    ) as LHStoredSchema

    if (lighthouseResult.scripts && lighthouseResult.scripts.length > 0) {
      const searchedArtifacts = await this.scriptFile.findArtifactsByScript(
        snapshotReport.projectId,
        lighthouseResult.scripts,
      )

      const artifactIds = searchedArtifacts.map((a) => a.id)

      artifacts.push(
        ...(artifactIds.length > 0
          ? await Artifact.find({
              where: {
                id: In(artifactIds),
              },
            })
          : []),
      )
    }

    const page = await Page.findOneByOrFail({ id: snapshotReport.pageId })

    return {
      projectId: snapshotReport.projectId,
      reportId: snapshotReport.id,
      artifacts: uniqBy(artifacts, (a) => a.id).map((a) => ({ ...a, createdAt: a.createdAt.toISOString() })),
      snapshotReport: {
        jsCoverageStorageKey: snapshotReport.jsCoverageStorageKey,
        traceEventsStorageKey: snapshotReport.traceEventsStorageKey,
        reactProfileStorageKey: snapshotReport.reactProfileStorageKey,
        lighthouseStorageKey: snapshotReport.lighthouseStorageKey,
        traceDataStorageKey: snapshotReport.traceDataStorageKey,
        requestsStorageKey: snapshotReport.requestsStorageKey,
        pageUrl: page.url,
        scripts: lighthouseResult.scripts,
      },
    }
  }

  async getSourceIssues(projectId: number, { first, after, skip }: PaginationInput, hash?: string, issueCode?: string) {
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

    if (issueCode) {
      qb.andWhere('code = :issueCode', { issueCode })
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

  async handleJobUpload(reportId: number, uploadSize: number) {
    await this.reportService.handleReportUploadSize(reportId, uploadSize)
  }
}
