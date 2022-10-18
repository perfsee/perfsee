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

import { Artifact, InternalIdUsage, SnapshotReport, SourceIssue } from '@perfsee/platform-server/db'
import { EventEmitter } from '@perfsee/platform-server/event'
import { PaginationInput } from '@perfsee/platform-server/graphql'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { JobType, SourceAnalyzeJob } from '@perfsee/server-common'
import { FlameChartDiagnostic } from '@perfsee/shared'

@Injectable()
export class SourceService implements OnApplicationBootstrap {
  constructor(
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

  async startSourceIssueAnalyze(snapshotReportId: number) {
    const snapshotReport = await SnapshotReport.findOneByOrFail({ id: snapshotReportId })

    this.logger.verbose('Emit source code analyse', { snapshotReportId: snapshotReport.id })
    await this.event.emitAsync('job.create', {
      type: JobType.SourceAnalyze,
      payload: {
        entityId: snapshotReport.id,
        projectId: snapshotReport.projectId,
      },
    })
  }

  async getSourceJobPayload(snapshotReportId: number): Promise<SourceAnalyzeJob | null> {
    const snapshotReport = await SnapshotReport.findOneByOrFail({ id: snapshotReportId })

    if (
      !(
        snapshotReport.traceEventsStorageKey &&
        snapshotReport.lighthouseStorageKey &&
        snapshotReport.jsCoverageStorageKey
      )
    ) {
      return null
    }

    const artifacts = await Artifact.createQueryBuilder()
      .where('id in (:...artifactIds)', {
        artifactIds: snapshotReport.artifactIds ?? [],
      })
      .select(['build_key as buildKey', 'id'])
      .getRawMany<{ id: number; buildKey: string }>()

    const artifactBuildKeys = Object.fromEntries(artifacts.map((a) => [a.id, a.buildKey]))

    return {
      projectId: snapshotReport.projectId,
      reportId: snapshotReport.id,
      artifactBuildKeys,
      snapshotReport: {
        jsCoverageStorageKey: snapshotReport.jsCoverageStorageKey,
        lighthouseStorageKey: snapshotReport.lighthouseStorageKey,
        traceEventsStorageKey: snapshotReport.traceEventsStorageKey,
      },
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
