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

import { VscodeSnapshotsQuery, vscodeSnapshotsQuery } from '@perfsee/schema'

import { memoizePromise } from '../utils/cache'

import { ApiClient } from './api-client'

export type SnapshotsResult = VscodeSnapshotsQuery['project']['snapshots']['edges'][number]['node']

export async function getSnapshotsByCommit(client: ApiClient, projectId: string, hash: string) {
  const result = await client.query({
    query: vscodeSnapshotsQuery,
    variables: {
      projectId,
      hash,
      pagination: {
        first: 100,
      },
    },
  })

  return result.project.snapshots.edges.map((edge) => edge.node)
}

export const memoizeGetSnapshotsByCommit = memoizePromise(
  getSnapshotsByCommit,
  (_, projectId, hash) => projectId + '/' + hash,
)

export async function getSnapshots(client: ApiClient, projectId: string, size: number) {
  const result = await client.query({
    query: vscodeSnapshotsQuery,
    variables: {
      projectId,
      pagination: {
        first: size,
      },
      hashRequired: true,
    },
  })

  return result.project.snapshots.edges.map((edge) => edge.node)
}

export const memoizeGetSnapshots = memoizePromise(getSnapshots, (_, projectId, size) => projectId + '/' + size)
