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

import { PuppeteerNode } from 'puppeteer-core'

import { browserWrapper } from './browser'
import { NotSupportFunction } from './utils'
import { createWrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-puppeteer
export const puppeteerNodeWrapper = createWrapper<PuppeteerNode>('PuppeteerNode', (puppeteer, options) => {
  return {
    connect: NotSupportFunction,
    launch: () => Promise.resolve(browserWrapper.wrap(options.browser, options)),
    executablePath: NotSupportFunction,
    product: puppeteer.product,
    defaultArgs: NotSupportFunction,
    createBrowserFetcher: NotSupportFunction,
    devices: {},
    errors: {},
    networkConditions: {},
    registerCustomQueryHandler: NotSupportFunction,
    unregisterCustomQueryHandler: NotSupportFunction,
    customQueryHandlerNames: NotSupportFunction,
    clearCustomQueryHandlers: NotSupportFunction,
    lastLaunchedProduct: puppeteer.lastLaunchedProduct,
    defaultProduct: puppeteer.defaultProduct,
    trimCache: () => puppeteer.trimCache(),
  }
})
