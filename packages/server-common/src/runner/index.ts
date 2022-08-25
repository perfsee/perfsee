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

import { JobLog } from '@perfsee/shared'

import { JobType, UpdateJobEvent } from '../job'

export const UNKNOWN_RUNNER_ZONE = '__UNKNOWN__'

export interface RunnerInfo {
  name: string
  version: string
  nodeVersion: string
  platform: string
  arch: string
  zone: string
  extra?: Record<string, string | number | boolean>
}

export interface JobInfo<Payload = any> {
  jobId: number
  jobType: JobType
  payload: Payload
  timeout?: number
}

export interface RegisterRunnerParams {
  token: string
  info: RunnerInfo
}

export interface RegisterRunnerResponse {
  token: string
  set: {
    jobType: JobType
    concurrency: number
  }
}

export interface JobRequestParams {
  info: RunnerInfo
}

export interface JobRequestResponse {
  job?: JobInfo | null
  set?: {
    jobType: JobType
    concurrency: number
  }
}

export interface UpdateJobTraceParams {
  jobId: number
  trace: JobLog[]
  jobUpdates?: UpdateJobEvent
  duration?: number
  done?: boolean
  failedReason?: string
}

export interface UpdateJobTraceResponse {
  canceled: boolean
}

export type RunnerScriptResponse = {
  version: string
  storageKey: string
  sha256: string
}
