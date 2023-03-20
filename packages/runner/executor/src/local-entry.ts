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

import { JobType } from '@perfsee/server-common'

export function localRunnerScriptEntry(jobType: JobType) {
  switch (jobType) {
    case JobType.BundleAnalyze:
      return require.resolve('@perfsee/job-runner-bundle/src/loader.js')
    case JobType.LabAnalyze:
    case JobType.LabPing:
    case JobType.E2EAnalyze:
      return require.resolve('@perfsee/job-runner-lab/src/loader.js')
    case JobType.SourceAnalyze:
      return require.resolve('@perfsee/job-runner-source/src/loader.js')
    case JobType.PackageAnalyze:
      return require.resolve('@perfsee/job-runner-package/src/loader.js')
    default:
      throw new Error('Unknown job type')
  }
}
