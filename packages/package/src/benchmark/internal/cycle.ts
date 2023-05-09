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

import { CycleFn } from './common-types'
import getCaseResult from './get-case-result'
import getSummary from './get-summary'

type Cycle = (fn?: CycleFn) => Promise<(suiteObj: Suite) => Suite>

/**
 * Handles complete events of each case
 */
// eslint-disable-next-line @typescript-eslint/require-await
const cycle: Cycle = async (fn) => (suiteObj) => {
  suiteObj.on('cycle', (event: Event) => {
    const summary = getSummary(event)
    const current = getCaseResult(event)
    const output = fn?.(current, summary)

    if (output) {
      console.info(output)
    }
  })
  return suiteObj
}

export { cycle, Cycle }
export default cycle
