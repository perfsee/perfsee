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

import type { Event, Suite } from 'benchmark'

import { BenchmarkSuite, CompleteFn, Summary } from './common-types'
import getSummary from './get-summary'
import { getGlobal } from './util'

type Complete = (fn?: CompleteFn) => Promise<(suiteObj: BenchmarkSuite) => Suite>

const collectResult = (suiteObj: BenchmarkSuite, summary: Summary) => {
  const result = {
    ...summary,
    rawTestMap: Object.fromEntries(suiteObj.rawTestMap?.entries() ?? []),
  }

  getGlobal()?.pushResult?.(result)
}

/**
 * Handles complete event
 */
// eslint-disable-next-line @typescript-eslint/require-await
const complete: Complete = async (fn) => (suiteObj) => {
  suiteObj.on('complete', (event: Event) => {
    const summary = getSummary(event)
    fn?.(summary)
    collectResult(suiteObj as any, summary)
    suiteObj.resolve?.(1)
  })
  return suiteObj
}

export { complete, Complete }
export default complete
