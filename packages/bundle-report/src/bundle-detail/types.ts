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

import { GitHost, BundleDiff, EntryDiff, Diff, Size, BundleAuditScore } from '@perfsee/shared'

export interface ArtifactDiff {
  project?: {
    id: string
    host: GitHost
    namespace: string
    name: string
  }
  id: number | string
  branch: string
  hash: string
  createdAt: string
  score: number
  baseline?: Omit<ArtifactDiff, 'baseline' | 'project'>
  size?: Size | null
  version?: {
    commitMessage?: string | null
  } | null
  name: string
}

export interface ItemAudit {
  desc: string
  title: string
  score: BundleAuditScore
  link?: string
}

export { BundleDiff, EntryDiff, Diff, Size }
