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
  HeaderType,
  CookieType,
  MetricKeyType,
  LocalStorageType,
  EntryDiffBrief,
} from '@perfsee/shared'

type PartialSnapshotReport = {
  status?: SnapshotStatus
  failedReason?: string
  lighthouseStorageKey?: string
  screencastStorageKey?: string
  jsCoverageStorageKey?: string
  traceEventsStorageKey?: string
  reactProfileStorageKey?: string
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
  localStorage: LocalStorageType[]
  reactProfiling: boolean
  enableProxy: boolean
  loginScript: string | null
}

export type E2EJobPayload = LabJobPayload & {
  e2eScript: string | null
}

export type PingJobPayload = Pick<LabJobPayload, 'url' | 'cookies' | 'deviceId' | 'headers'> & {
  key: string
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

export enum SourceStatus {
  Pending,
  Running,
  Completed,
  Failed,
}

export interface PackageJobPayload {
  packageBundleId: number
  packageString?: string
  buildKey?: string
  baselineReportKey?: string | null
}

export interface BundleJobPayload {
  artifactId: number
  buildKey: string
  baselineReportKey?: string | null
}

export type BundleJobEntryPoint = EntryDiffBrief & {
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
  moduleMapKey: string | undefined
  moduleSourceKey: string | undefined
  entryPoints: Record<string, BundleJobEntryPoint>
  duration: number
  score: number
  totalSize: Size
  scripts?: { fileName: string }[]
}

export type PackageJobRunningUpdate = {
  packageBundleId: number
  status: BundleJobStatus.Running
}

export type PackageJobFailedUpdate = {
  packageBundleId: number
  status: BundleJobStatus.Failed
  failedReason: string
  duration: number
}
export type PackageJobPassedUpdate = {
  packageBundleId: number
  status: BundleJobStatus.Passed
  reportKey: string
  benchmarkKey: string | undefined
  duration: number
  size: Size
  hasSideEffects?: boolean
  hasJSModule?: boolean
  hasJSNext?: boolean
  isModuleType?: boolean
}
export type PackageJobUpdate = PackageJobRunningUpdate | PackageJobFailedUpdate | PackageJobPassedUpdate

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

export type PingJobResult = {
  key: string
  status: 'success' | 'failed' | 'running' | 'pending'
}

export interface SourceAnalyzeJob {
  projectId: number
  reportId: number
  artifacts: {
    id: number
    iid: number
    name: string
    createdAt: string
    branch?: string
    hash: string
    buildKey: string
    reportKey?: string | null
    moduleMapKey?: string | null
  }[]
  snapshotReport: {
    pageUrl: string
    traceEventsStorageKey: string
    jsCoverageStorageKey: string
    lighthouseStorageKey: string
    reactProfileStorageKey?: string | null
    traceDataStorageKey?: string | null
    requestsStorageKey?: string | null
    scripts?: { fileName: string }[]
  }
}

export type SourceAnalyzeJobResult =
  | { status: SourceStatus.Running; reportId: number }
  | { status: SourceStatus.Failed; reportId: number }
  | {
      status: SourceStatus.Completed
      projectId: number
      reportId: number
      artifactIds: number[]
      diagnostics: FlameChartDiagnostic[]
      flameChartStorageKey: string
      lighthouseStorageKey: string
      sourceCoverageStorageKey?: string
      statisticsStorageKey?: string
      reactProfileStorageKey?: string
      traceDataStorageKey?: string
      requestsStorageKey?: string
    }
