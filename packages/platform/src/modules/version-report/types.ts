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

import { ArtifactByCommitQuery, SnapshotReportsByCommitQuery, IssuesByReportIdQuery } from '@perfsee/schema'
import { AuditsSchema, LHStoredSchema, MetricScoreSchema } from '@perfsee/shared'

type Unwrap<Element> = Element extends Array<infer S> ? S : unknown

export type Artifact = NonNullable<ArtifactByCommitQuery['project']['artifactByCommit']>

export type SourceIssue = IssuesByReportIdQuery['project']['snapshotReport']['issues'][0]

interface WithLoading {
  loading: boolean
}

export interface VersionCommits extends WithLoading {
  commits: string[]
}

export interface VersionArtifactJob extends WithLoading {
  artifact?: Artifact
}

export type ReportNode = Unwrap<NonNullable<SnapshotReportsByCommitQuery['project']['snapshotReports']>>

type ReportMetrics = {
  pwa: number
  seo: number
  performance: number
  accessibility: number
  bestPractices: number
}

export type VersionSnapshotReport = Omit<ReportNode, '__typename'> & {
  metrics?: ReportMetrics
  lastMetrics?: ReportMetrics
}

export interface VersionLab extends WithLoading {
  reports?: VersionSnapshotReport[]
}

export interface VersionIssue extends WithLoading {
  issues: SourceIssue[]
}

export type VersionIssues = Record<number, VersionIssue>

export type LighthouseTosContent = Pick<LHStoredSchema, 'lhrAudit' | 'lhrCategories' | 'metricScores'>

export type EntryPointSchema = NonNullable<Artifact['entrypoints']>[0]

export type VersionLHContent = {
  audits?: AuditsSchema
  categories?: Record<string, LH.Result.Category>
  metricScores: MetricScoreSchema[]
  loading: boolean
}
