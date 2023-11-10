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

import { Browser } from 'puppeteer-core'

import { pageWrapper } from './page'
import { IgnoreFunction, NotSupportFunction } from './utils'
import { createWrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-browser
export const browserWrapper = createWrapper<Browser>('Browser', (browser, options) => {
  return {
    process: () => null,
    createIncognitoBrowserContext: NotSupportFunction,
    browserContexts: NotSupportFunction,
    defaultBrowserContext: NotSupportFunction,
    wsEndpoint: NotSupportFunction,
    newPage: () => Promise.resolve(pageWrapper.wrap(options.page, options)),
    targets: NotSupportFunction,
    target: NotSupportFunction,
    waitForTarget: NotSupportFunction,
    pages: NotSupportFunction,
    version: () => browser.version(),
    userAgent: () => browser.userAgent(),
    close: IgnoreFunction,
    disconnect: NotSupportFunction,
    isConnected: NotSupportFunction,
    on: NotSupportFunction,
    off: NotSupportFunction,
    removeListener: NotSupportFunction,
    addListener: NotSupportFunction,
    emit: NotSupportFunction,
    once: NotSupportFunction,
    listenerCount: NotSupportFunction,
    removeAllListeners: NotSupportFunction,
    connected: true,
  }
})
