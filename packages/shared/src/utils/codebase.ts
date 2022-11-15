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

import { CommonGitHost, GitHost } from '@perfsee/utils'

export function getCommitLink(project: { host: GitHost; namespace: string; name: string }, commitHash: string) {
  const host = GitHost[project.host]
  const gitHost = new CommonGitHost({ ...project, host })

  return gitHost.commitUrl(commitHash)
}

export function getPrLink(project: { host: GitHost; namespace: string; name: string }, prNumber: number) {
  const host = GitHost[project.host]
  const gitHost = new CommonGitHost({ ...project, host })

  return gitHost.prUrl(prNumber)
}
