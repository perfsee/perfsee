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

import { vscodeGetProjectsByNamespaceAndNameQuery, VscodeGetProjectsByNamespaceAndNameQuery } from '@perfsee/schema'
import { GitHost } from '@perfsee/shared'

import { memoizePromise } from '../utils/cache'

import { ApiClient } from './api-client'

export type ProjectInfo = VscodeGetProjectsByNamespaceAndNameQuery['projectsByRepo']

export async function getProjectsByNamespaceAndName(client: ApiClient, host: GitHost, namespace: string, name: string) {
  const result = await client.query({
    query: vscodeGetProjectsByNamespaceAndNameQuery,
    variables: {
      namespace,
      name,
      host,
    },
  })

  return result.projectsByRepo
}

export const memoizeGetProjectsByNamespaceAndName = memoizePromise(
  getProjectsByNamespaceAndName,
  (_, host, namespace, name) => host + '/' + namespace + '/' + name,
)
