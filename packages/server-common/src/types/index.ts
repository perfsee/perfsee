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
  ThrottleType,
  FlameChartDiagnostic,
  Size,
  BundleAuditWarning,
  EntryDiff,
  HeaderType,
  CookieType,
  MetricKeyType,
} from '@perfsee/shared'

type PartialSnapshotReport = {
  status?: SnapshotStatus
  failedReason?: string
  lighthouseStorageKey?: string
  screencastStorageKey?: string
  jsCoverageStorageKey?: string
  traceEventsStorageKey?: string
  performanceScore?: number | null
  metrics?: Record<MetricKeyType, number | null>
}

export interface LabJobPayload {
  url: string
  reportId: number
  throttle: Partial<ThrottleType>
  deviceId: string
  runs: number
  headers: HeaderType[]
  cookies: CookieType[]
}

export type E2EJobPayload = LabJobPayload & {
  e2eScript: string | null
}

export enum BundleJobStatus {
  Pending,
  Running,
  Passed,
  Failed,
}

export enum SnapshotStatus {
  Pending,
  Running,
  Completed,
  Scheduled,
  Failed,
}

export interface BundleJobPayload {
  artifactId: number
  buildKey: string
  baselineReportKey?: string | null
}

export type BundleJobEntryPoint = EntryDiff & {
  name: string
  warnings: BundleAuditWarning[]
}

export type BundleJobRunningUpdate = {
  artifactId: number
  status: BundleJobStatus.Running
}

export type BundleJobFailedUpdate = {
  artifactId: number
  status: BundleJobStatus.Failed
  failedReason: string
  duration: number
}
export type BundleJobPassedUpdate = {
  artifactId: number
  status: BundleJobStatus.Passed
  reportKey: string
  contentKey: string | undefined
  entryPoints: Record<string, BundleJobEntryPoint>
  duration: number
  score: number
  totalSize: Size
}

export type BundleJobUpdate = BundleJobRunningUpdate | BundleJobFailedUpdate | BundleJobPassedUpdate
export function isPassedBundleJobUpdate(update: BundleJobUpdate): update is BundleJobPassedUpdate {
  return update.status === BundleJobStatus.Passed
}

export type LabJobResult = {
  snapshotReport: PartialSnapshotReport & { id: number }
}

export type E2EJobResult = {
  snapshotReport: PartialSnapshotReport & { id: number }
}

export interface SourceAnalyzeJob {
  projectId: number
  snapshotId: number
  hash: string
  artifacts: string[]
  snapshotReports: {
    id: number
    traceEventsStorageKey: string
    jsCoverageStorageKey: string
    pageUrl: string
  }[]
}

export type SourceAnalyzeJobResult = {
  projectId: number
  hash: string
  result: Array<{
    reportId: number
    diagnostics: FlameChartDiagnostic[]
    flameChartStorageKey: string
    sourceCoverageStorageKey?: string
  }>
}
