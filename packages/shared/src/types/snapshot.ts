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

import { NetworkRequest as RequestSchema, RequestTiming, StackTrack } from '@perfsee/flamechart/types'
import { Task } from '@perfsee/tracehouse'

import { MetricScoreSchema, TimelineSchema, UserTimingSchema } from './lighthouse-score'
import { TraceEvent } from './trace-event'

export enum LifeCycle {
  dataReceived = 'Network.dataReceived',
  loadingFinished = 'Network.loadingFinished',
  requestWillBeSent = 'Network.requestWillBeSent',
  requestWillBeSentExtraInfo = 'Network.requestWillBeSentExtraInfo',
  responseReceived = 'Network.responseReceived',
  responseReceivedExtraInfo = 'Network.responseReceivedExtraInfo',
  loadingFailed = 'Network.loadingFailed',
}

export type TimingSchema = {
  connectEnd: number
  connectStart: number
  dnsEnd: number
  dnsStart: number
  pushEnd: number
  pushStart: number
  receiveHeadersEnd: number
  requestTime: number /**timestamp */
  sendEnd: number
  sendStart: number
  sslEnd: number
  sslStart: number
  proxyEnd: number
  workerStart: number
}

type ResponseType = {
  protocol: string
  status: number
  timing: TimingSchema
  headers: Record<string, string>
  url: string
}

export type ParamSchema = {
  headersText: string
  request: {
    method: string
    url: string
    initialPriority: string
    headers: Record<string, string>
  }
  response?: ResponseType
  redirectResponse?: ResponseType
  headers?: Record<string, string>
  timestamp: number
  encodedDataLength?: number
  type?: string
  dataLength?: number
}

export type NetworkRequestDetailSchema = {
  requestId: string
  url: string
  startTime: number
  endTime: number
  transferSize: number
  resourceSize: number
  statusCode: number
  method: string
  status: string
  protocol: string
  priority: string
  type: string
  timing: TimingSchema
  resourceType: string
  responseReceivedTime: number // timestamp
}

export type ArtifactSchema = Record<LifeCycle, ParamSchema>

export type CookieType = {
  name: string
  value: string
  domain: string | null
  path: string | null
  httpOnly: boolean
  secure: boolean
  expire: string | null
  sameSite?: 'Strict' | 'Lax' | 'None'
}

export type HeaderType = {
  key: string
  value: string
  host: string
}

export type LocalStorageType = {
  key: string
  value: string
}

export type ThrottleType = {
  id: string
  download: number
  upload: number
  latency: number
  rtt: number
  cpuSlowdown: number
}

export type AuditsSchema = Record<string, LH.Audit.Result>

export type TraceTimesWithoutFCP = Omit<LH.Artifacts.TraceTimes, 'firstContentfulPaint'> & {
  firstContentfulPaint?: number
}

type LHTosUserFlowSchema = {
  stepName: string
  stepUrl: string
  stepMode: LH.Result.GatherMode
  lhrAudit: AuditsSchema
  lhrCategories: Record<string, LH.Result.Category>
  timings: TraceTimesWithoutFCP
  timelines: TimelineSchema[]
  metricScores: MetricScoreSchema[]
}

export type LHStoredSchema = {
  lhrAudit: AuditsSchema
  lhrCategories: Record<string, LH.Result.Category>
  traceData: Task[]
  timings: TraceTimesWithoutFCP
  artifactsResult: RequestSchema[]
  artifactsResultBaseTimestamp?: number
  timelines: TimelineSchema[]
  metricScores: MetricScoreSchema[]
  userFlow?: LHTosUserFlowSchema[]
  userTimings?: UserTimingSchema[]
  lighthouseVersion?: string
  scripts?: { fileName: string }[]
}

export interface DomNode {
  attributes: string[]
  localName: string
}

export interface CauseForLcp {
  LcpElement: {
    node: DomNode
    outerHtml: string
    boxModel: {
      height: number
      width: number
    }
  } | null
  criticalPathForLcp: {
    request?: RequestSchema
  } | null
  networkBlockings: TraceEvent[]
  metrics: {
    elementRenderDelay: number | null
    navigationTimeToFirstByte: number | null
    resourceLoadDelay: number | null
    resourceLoadTime: number | null
  }
  longtasks: TraceEvent[]
}

export { RequestSchema, RequestTiming as Timing, StackTrack }
