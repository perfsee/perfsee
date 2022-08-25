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

import { QueryVariables, RecursiveMaybeFields, GraphQLQuery, QueryResponse } from '@perfsee/schema'
import { RequestInit } from 'node-fetch'

type AllowedRequestContent = Omit<RequestInit, 'method' | 'body' | 'signal'>

export interface Variables {
  [key: string]: any
}

export interface RequestBody<V = Variables> {
  operationName?: string
  variables: V
  query: string
  form?: FormData
}

export type RequestOptions<Q extends GraphQLQuery> = {
  query: Q
  context?: AllowedRequestContent
} & (QueryVariables<Q> extends never | Record<any, never>
  ? {
      variables?: undefined
    }
  : { variables: RecursiveMaybeFields<QueryVariables<Q>> })

export type QueryOptions<Q extends GraphQLQuery> = RequestOptions<Q>
export type MutationOptions<Q extends GraphQLQuery> = Omit<RequestOptions<Q>, 'query'> & {
  mutation: Q
}

export { GraphQLQuery, QueryResponse }

export type UnwrapPromise<T> = T extends PromiseLike<infer U> ? UnwrapPromise<U> : T
