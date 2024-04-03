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

import { workerMain } from '@perfsee/job-runner-shared'
import { JobType } from '@perfsee/server-common'

import { UserFlowJobWorker, LabJobWorker, PingJobWorker } from './lighthouse'

workerMain((data) => {
  return data.job.jobType === JobType.LabPing
    ? new PingJobWorker(data)
    : data.job.jobType === JobType.E2EAnalyze
    ? new UserFlowJobWorker(data)
    : new LabJobWorker(data)
})
