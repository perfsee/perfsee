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

import { SharedColors } from '@perfsee/dls'
import { SnapshotReportQuery } from '@perfsee/schema'
import {
  TimingType,
  TimelineSchema,
  MetricScoreSchema,
  RequestSchema,
  UserTimingSchema,
  AuditsSchema,
  TraceTimesWithoutFCP,
} from '@perfsee/shared'
import { Task } from '@perfsee/tracehouse'

export type SnapshotReportSchema = SnapshotReportQuery['project']['snapshotReport']

// execution chart type
export enum RecordCategory {
  LongTask = 'longTask',
  Event = 'event',
  Metric = 'metric',
}

export enum RecordType {
  scriptEvaluation = 'scriptEvaluation',
  other = 'other',
  parseHTML = 'parseHTML',
  longTask = 'longTask',
  styleLayout = 'styleLayout',
  paintCompositeRender = 'paintCompositeRender',
}

export enum PerformanceTabType {
  Overview = 'overview',
  UserFlow = 'user-flow',
  Asset = 'asset',
  Report = 'analysis-report',
  Flamechart = 'flamechart',
  SourceCoverage = 'source-coverage',
  SourceStatistics = 'source-statistics',
  Breakdown = 'breakdown', // for multi reports
  React = 'react', // for react profile
}

export enum AnalysisReportTabType {
  Performance = 'performance',
  PWA = 'pwa',
  SEO = 'seo',
  Accessibility = 'accessibility',
  BestPractices = 'best-practices',
}

export type SnapshotDetailType = {
  report: SnapshotReportSchema
  requests: RequestSchema[]
  requestsBaseTimestamp?: number
  audits: AuditsSchema
  traceData?: Task[]
  categories?: Record<string, LH.Result.Category>
  timings: TraceTimesWithoutFCP
  timelines?: TimelineSchema[]
  metricScores?: MetricScoreSchema[]
  userFlow?: SnapshotUserFlowDetailType[]
  userTimings?: UserTimingSchema[]
  lighthouseVersion?: string
}

export type SnapshotUserFlowDetailType = Omit<SnapshotDetailType, 'userFlow' | 'report'> & {
  stepName: string
  stepUrl: string
  stepMode: LH.Result.GatherMode
}

export enum LighthouseGroupType {
  opportunity = 'opportunity',
  manual = 'manual',
  passed = 'passed',
  notApply = 'notApply',
}

export type LighthouseAudit = LH.Audit.Result & {
  relevant?: string[] // metrics keys
}

export enum RequestType {
  Document = 'Document',
  Script = 'Script',
  Stylesheet = 'Stylesheet',
  XHR = 'XHR',
  Image = 'Image',
  Other = 'Other',
  Font = 'Font',
  Media = 'Media',
  Fetch = 'Fetch',
  Ping = 'Ping',
}

export const RequestTypeColorsMaps: {
  [k in RequestType]: { foreground: string; background: string }
} = {
  [RequestType.Document]: { background: SharedColors.magentaPink10, foreground: 'white' },
  [RequestType.Image]: { background: SharedColors.magenta10, foreground: 'white' },
  [RequestType.XHR]: { background: SharedColors.greenCyan10, foreground: 'white' },
  [RequestType.Script]: { background: SharedColors.yellow10, foreground: 'black' },
  [RequestType.Stylesheet]: { background: SharedColors.blueMagenta10, foreground: 'white' },
  [RequestType.Other]: { background: SharedColors.cyan20, foreground: 'white' },
  [RequestType.Font]: { background: SharedColors.gray20, foreground: 'white' },
  [RequestType.Media]: { background: SharedColors.orange20, foreground: 'white' },
  [RequestType.Fetch]: { background: SharedColors.blue10, foreground: 'white' },
  [RequestType.Ping]: { background: SharedColors.gray10, foreground: 'white' },
}

export type MetricSchema = {
  kind: TimingType
  range: number[]
  cat: RecordCategory
  startTime: number
}

export enum RequestPeriod {
  Blocked = 'Blocked',
  DNS = 'DNS',
  Connect = 'Connect',
  SSL = 'SSL',
  Send = 'Send',
  Wait = 'Wait',
  Receive = 'Receive',
}

export const RequestPeriodMaps: {
  [k in RequestPeriod]: { background: string; height: number }
} = {
  [RequestPeriod.Blocked]: { background: SharedColors.gray10, height: 8 },
  [RequestPeriod.DNS]: { background: SharedColors.yellowGreen10, height: 8 },
  [RequestPeriod.Connect]: { background: SharedColors.yellow10, height: 8 },
  [RequestPeriod.SSL]: { background: SharedColors.magenta10, height: 8 },
  [RequestPeriod.Send]: { background: SharedColors.green20, height: 12 },
  [RequestPeriod.Wait]: { background: SharedColors.greenCyan10, height: 12 },
  [RequestPeriod.Receive]: { background: SharedColors.blue10, height: 12 },
}
