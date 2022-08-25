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

import { PaginationInput, vscodeArtifactByCommitQuery, vscodeArtifactsQuery } from '@perfsee/schema'

import { UnwrapPromise } from '../types/graphql'
import { memoizePromise } from '../utils/cache'

import { ApiClient } from './api-client'

export type ArtifactResult =
  | UnwrapPromise<ReturnType<typeof getLastArtifactsByProjectId>>['nodes'][number]
  | UnwrapPromise<ReturnType<typeof getArtifactByHash>>

export async function getArtifactByHash(client: ApiClient, projectId: string, hash: string) {
  const result = await client.query({
    query: vscodeArtifactByCommitQuery,
    variables: {
      projectId,
      hash,
    },
  })

  return result.project.artifactByCommit
}

export const memoizeGetArtifactByHash = memoizePromise(
  getArtifactByHash,
  (_, projectId, hash) => projectId + '/' + hash,
)

export async function getLastArtifactsByProjectId(
  client: ApiClient,
  projectId: string,
  pagination: Partial<PaginationInput> = { first: 20 },
) {
  const result = await client.query({
    query: vscodeArtifactsQuery,
    variables: {
      projectId,
      pagination,
    },
  })

  return {
    nodes: result.project.artifacts.edges.map((edge) => edge.node),
    pageInfo: result.project.artifacts.pageInfo,
  }
}

export const memoizeGetLastArtifactsByProjectId = memoizePromise(
  getLastArtifactsByProjectId,
  (_, projectId, pagination) => projectId + '/' + JSON.stringify(pagination),
)
