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

export * from './date'
export * from './get-lh-run-data'
export * from './data-loader'
export * from './artifact-link'
export * from './script-check'

export function wait(n = 1000) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve()
    }, n)
  })
}
