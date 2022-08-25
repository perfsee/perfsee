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

import { VscodeSourceIssuesQuery, vscodeSourceIssuesQuery } from '@perfsee/schema'

import { memoizePromise } from '../utils/cache'

import { ApiClient } from './api-client'

export type SourceIssueResult = VscodeSourceIssuesQuery['project']['sourceIssues']['edges'][number]['node']

export async function getSourceIssuesByHash(
  client: ApiClient,
  projectId: string,
  hash: string,
): Promise<SourceIssueResult[]> {
  const result = await client.query({
    query: vscodeSourceIssuesQuery,
    variables: {
      projectId,
      hash,
      pagination: {
        // TODO: load more button
        first: 100,
      },
    },
  })

  return result.project.sourceIssues.edges.map((edge) => edge.node)
}

export const memoizeGetSourceIssuesByHash = memoizePromise(getSourceIssuesByHash, (_, projectId, hash) =>
  [projectId, hash].join('/'),
)
