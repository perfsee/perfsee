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

import { TestingModule } from '@nestjs/testing'
import ava, { TestFn } from 'ava'

import { DeepMocked } from './create-mock'

export * from './create-mock'
export * from './database'
export * from './graphql-client'
export * from './client'

// eslint-disable-next-line
interface Type<T = any> extends Function {
  new (...args: any[]): T
}
// eslint-disable-next-line
interface Abstract<T> extends Function {
  prototype: T
}
interface ContextId {
  readonly id: number
}

export interface DeepMockedModule extends TestingModule {
  get: <TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol,
    options?: {
      strict?: boolean
    },
  ) => DeepMocked<TResult>
  resolve: <TInput = any, TResult = TInput>(
    typeOrToken: Type<TInput> | Abstract<TInput> | string | symbol,
    contextId?: ContextId,
    options?: {
      strict?: boolean
    },
  ) => Promise<DeepMocked<TResult>>
}

export default ava as TestFn<{
  module: DeepMockedModule
}>

export const defaultPagination = {
  first: 10,
  skip: 0,
  after: null,
}
