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
  BundleJobUpdate,
  E2EJobResult,
  LabJobResult,
  PackageJobUpdate,
  PingJobResult,
  SourceAnalyzeJobResult,
} from '../types'

export enum JobType {
  All = '__all__',
  BundleAnalyze = 'job.BundleAnalyze',
  PackageAnalyze = 'job.PackageAnalyze',
  LabAnalyze = 'job.LabAnalyze',
  E2EAnalyze = 'job.E2EAnalyze',
  SourceAnalyze = 'job.SourceAnalyze',
  LabPing = 'job.LabPing',
}

export type JobTypeWithPayload =
  | {
      type: JobType.BundleAnalyze
      payload: { entityId: number; projectId: number }
    }
  | {
      type: JobType.LabAnalyze
      payload: { entityId: number; projectId: number }
    }
  | {
      type: JobType.E2EAnalyze
      payload: { entityId: number; projectId: number }
    }
  | {
      type: JobType.SourceAnalyze
      payload: { entityId: number; projectId: number }
    }
  | {
      type: JobType.LabPing
      payload: { entityId: number; projectId: number; extra: { key: string } }
    }
  | {
      type: JobType.PackageAnalyze
      payload: { entityId: number; projectId: number; packageId: number }
    }

export type CreateJobPayload<T extends JobType> = Extract<JobTypeWithPayload, { type: T }>['payload']

export type CreateJobEvent<T extends JobType = any> = {
  type: T
  payload: CreateJobPayload<T>
  zone?: string
}

export type JobTypeWithResult =
  | {
      type: JobType.BundleAnalyze
      payload: BundleJobUpdate
    }
  | {
      type: JobType.LabAnalyze
      payload: LabJobResult
    }
  | {
      type: JobType.E2EAnalyze
      payload: E2EJobResult
    }
  | {
      type: JobType.SourceAnalyze
      payload: SourceAnalyzeJobResult
    }
  | {
      type: JobType.LabPing
      payload: PingJobResult
    }
  | {
      type: JobType.PackageAnalyze
      payload: PackageJobUpdate
    }

export type UpdateJobEvent = JobTypeWithResult
export type UpdateJobPayload<T extends JobType> = Extract<JobTypeWithResult, { type: T }>['payload']
