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

import getType from '@arrows/dispatch/getType'
import types from '@arrows/dispatch/types'
import type { Suite } from 'benchmark'

import { BenchmarkSuite, Options } from './common-types'

type SkipResult = {
  name: 'skip'
}

export type Test = () => any | Test

type Deferred = {
  resolve: () => void
}

// eslint-disable-next-line @typescript-eslint/ban-types
const wrapFunctionName = <T extends Function>(fn: T, name: string): T =>
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('rawTest', `return function ${name}(){return rawTest.apply(this, arguments);}`)(fn)

const prepareCaseFn = async (test: Test) => {
  const fnUid = uid()
  const setupName = `benchmark_case_${fnUid}_setup`
  const fnName = `benchmark_case_${fnUid}`
  const theReturn = wrapFunctionName(test, setupName)()
  const returnType = getType(theReturn)

  if (returnType === types.Function && getType(theReturn()) === types.Promise) {
    const wrapped = wrapFunctionName(theReturn, fnName)
    return {
      rawTest: (deferred: Deferred) => wrapped().then(() => deferred.resolve()),
      defer: true,
      fnName,
    }
  }

  if (returnType === types.Function) {
    return {
      rawTest: wrapFunctionName(theReturn, fnName),
      defer: false,
      fnName,
    }
  }

  if (returnType === types.Promise) {
    const promiseContent = await theReturn

    if (getType(promiseContent) === types.Function) {
      const nestedReturnType = promiseContent()
      const wrapped = wrapFunctionName(promiseContent, fnName)

      if (getType(nestedReturnType) === types.Promise) {
        return {
          rawTest: (deferred: Deferred) => wrapped().then(() => deferred.resolve()),
          defer: true,
          fnName,
        }
      } else {
        return {
          rawTest: wrapped,
          defer: false,
          fnName,
        }
      }
    }

    const wrapped = wrapFunctionName(test, fnName)
    return {
      rawTest: (deferred: Deferred) => wrapped().then(() => deferred.resolve()),
      defer: true,
      fnName,
    }
  }

  return {
    rawTest: wrapFunctionName(test, fnName),
    defer: false,
    fnName,
  }
}

type Add = {
  (caseName: string, test: Test, options?: Options): Promise<(suiteObj: Suite) => Suite>
  only: (caseName: string, test: Test, options?: Options) => Promise<(suiteObj: Suite) => Suite>
  skip: (...args: any[]) => Promise<SkipResult>
}

const uid = () => new Date().getTime().toString(36) + Math.random().toString(36).slice(2)

/**
 * Adds a benchmark case
 */
const add: Add = async (caseName, test, options = {}) => {
  const { rawTest, defer, fnName } = await prepareCaseFn(test)

  const fn = (suiteObj: BenchmarkSuite) => {
    suiteObj.rawTestMap ??= new Map()
    suiteObj.rawTestMap.set(caseName, fnName)

    suiteObj.add(caseName, rawTest, { ...options, defer })

    return suiteObj
  }

  Object.defineProperty(fn, 'name', { value: 'add' })

  return fn
}

// eslint-disable-next-line @typescript-eslint/require-await
add.only = async (caseName, test, options = {}) => {
  const fn = (suiteObj: Suite) => {
    suiteObj.add(caseName, typeof test() === 'function' ? test() : test, options)
    return suiteObj
  }

  Object.defineProperty(fn, 'name', { value: 'only' })

  return fn
}

add.skip = (..._args) => Promise.resolve({ name: 'skip' })

export { add, Add, SkipResult }
export default add
