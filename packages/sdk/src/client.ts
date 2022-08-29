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

import { merge } from 'lodash'

import { GraphQLQuery, propertyQuery, takeSnapshotMutation } from '@perfsee/schema'

import { mutate, query } from './graphql'
import { MutationOptions, QueryOptions } from './types'

export interface ClientOptions {
  accessToken: string
  host: string
}

export class Client {
  constructor(public readonly options: ClientOptions) {}

  get authorizationHeader() {
    return {
      Authorization: 'Bearer ' + this.options.accessToken,
    }
  }

  async fetch(url: string, init?: RequestInit) {
    return fetch(url, merge({ headers: this.authorizationHeader }, init))
  }

  async query<Q extends GraphQLQuery>(options: Omit<QueryOptions<Q>, 'host'>) {
    return query<Q>(
      merge({ context: { headers: this.authorizationHeader }, host: this.options.host }, options as QueryOptions<Q>),
    ).catch((reason) => {
      throw reason
    })
  }

  async mutate<Q extends GraphQLQuery>(options: Omit<MutationOptions<Q>, 'host'>) {
    return mutate<Q>(
      merge({ context: { headers: this.authorizationHeader }, host: this.options.host }, options as MutationOptions<Q>),
    ).catch((reason) => {
      throw reason
    })
  }

  async projectSettings(projectId: string) {
    const result = await this.query({
      query: propertyQuery,
      variables: { projectId },
    })
    return result.project
  }

  async takeSnapshot(
    projectId: string,
    pageIds: number[],
    profileIds?: number[],
    envIds?: number[],
    title?: string,
    commitHash?: string,
  ) {
    const result = await this.mutate({
      mutation: takeSnapshotMutation,
      variables: {
        projectId,
        pageIds,
        profileIds,
        envIds,
        title,
        commitHash,
      },
    })
    return result.takeSnapshot
  }
}
