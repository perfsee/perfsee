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

import { GraphQLQuery } from './graphql'
import { Queries, Mutations } from './schema'

export type NotArray<T> = T extends Array<unknown> ? never : T

export type QueryVariables<Q extends GraphQLQuery> = Extract<Queries | Mutations, { name: Q['id'] }>['variables']
export type QueryResponse<Q extends GraphQLQuery> = Extract<Queries | Mutations, { name: Q['id'] }>['response']

type NullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? K : never
}[keyof T]

type NonNullableKeys<T> = {
  [K in keyof T]: null extends T[K] ? never : K
}[keyof T]

export type RecursiveMaybeFields<T> = T extends number | boolean | string | null | undefined
  ? T
  : {
      [K in NullableKeys<T>]?: RecursiveMaybeFields<T[K]>
    } & {
      [K in NonNullableKeys<T>]: RecursiveMaybeFields<T[K]>
    }

export * from './schema'
export * from './graphql'
