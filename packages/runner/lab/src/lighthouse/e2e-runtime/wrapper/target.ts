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

import { Target } from 'puppeteer-core'

import { browserWrapper } from './browser'
import { pageWrapper } from './page'
import { NotSupportFunction } from './utils'
import { webWorkerWrapper } from './web-worker'
import { createWrapper, Wrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-target
export const targetWrapper: Wrapper<Target> = createWrapper<Target>('Target', (target, options) => {
  return {
    browser: () => browserWrapper.wrap(target.browser(), options),
    browserContext: NotSupportFunction,
    createCDPSession: NotSupportFunction,
    opener: () => targetWrapper.wrapOrNull(target.opener() || null, options) || undefined,
    page: async () => pageWrapper.wrapOrNull(await target.page(), options),
    type: () => target.type(),
    url: () => target.url(),
    worker: async () => webWorkerWrapper.wrapOrNull(await target.worker(), options),
  }
})
