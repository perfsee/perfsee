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

import add, { Test } from './internal/add'
import { Options, Summary, CycleFn, CompleteFn } from './internal/common-types'
import complete from './internal/complete'
import cycle from './internal/cycle'
import suite from './internal/suite'

declare global {
  interface Window {
    pushResult: (result: Summary) => void
    benchmarks: (() => Promise<any>)[]
  }
}

export { add, complete, cycle, suite }

type Tests = Array<
  Test | [Test, (Options & { name?: string })?] | { test: Test; options?: Options & { name?: string } }
>

export interface Benchmark {
  (name: string, test: Test, options?: Options): void
  (name: string, tests: Tests): void
}

const benchmark: Benchmark = (
  name: string,
  testOrTests: Test | Tests,
  options?: Options & { cycleFn?: CycleFn; completeFn?: CompleteFn },
) => {
  if (Array.isArray(testOrTests)) {
    suite(
      name,
      ...testOrTests.map((test, i) => {
        const t = 'test' in test ? test.test : typeof test === 'function' ? test : test[0]
        const o = 'options' in test ? test.options : Array.isArray(test) ? test[1] : undefined
        const name = o?.name ?? `case ${i}`
        return add(name, t, o)
      }),
      cycle(options?.cycleFn),
      complete(options?.completeFn),
    )
  } else {
    suite(name, add('', testOrTests, options), cycle(options?.cycleFn), complete(options?.completeFn))
  }
}

export default benchmark
