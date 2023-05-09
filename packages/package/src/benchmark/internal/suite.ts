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

import { pipe } from '@arrows/composition'
import type { Event, Suite } from 'benchmark'
import Benchmark from 'benchmark'

import { SkipResult } from './add'
import { BenchmarkSuite } from './common-types'
import getSummary from './get-summary'
import { getGlobal } from './util'

type RawPartialMethod = (suiteObj: Suite) => Suite
type PartialMethod = Promise<RawPartialMethod | SkipResult>

type SuiteFn = (name: string, ...fns: PartialMethod[]) => void

/**
 * Creates and runs benchmark suite
 */
const suite: SuiteFn = (name, ...fns) => {
  const win = getGlobal()
  if (win) {
    win.benchmarks ??= []
    win.benchmarks.push(async () => {
      const unpackedFns = await Promise.all([...fns])
      const suiteObj: BenchmarkSuite = new Benchmark.Suite(name).on('start', () => {
        console.info(`Running "${name}" suite...`)
      })

      const hasOnly = unpackedFns.filter((fn) => fn.name === 'only').length > 0
      const items = (
        hasOnly
          ? unpackedFns.filter((fn) => fn.name !== 'add' && fn.name !== 'skip')
          : unpackedFns.filter((fn) => fn.name !== 'skip')
      ) as RawPartialMethod[]

      return new Promise((resolve, reject) => {
        ;(pipe(...items)(suiteObj) as Suite)
          .on('complete', (event: Event) => resolve(getSummary(event)))
          .on('error', reject)
          .run()
      })
    })
  }
}

export { suite }
export default suite
