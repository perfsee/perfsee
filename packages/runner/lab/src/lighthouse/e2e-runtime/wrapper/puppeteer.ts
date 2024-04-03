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

import * as ppt from 'puppeteer-core'

import { browserWrapper } from './browser'
import { locatorWrapperFn } from './locator'
import { WrapperOptions } from './options'
import { NotSupportFunction } from './utils'
import { createWrapper } from './wrapper'

type PuppeteerNamespace = typeof ppt

type MapClass<T> = {
  [K in keyof T]?: Partial<T[K]>
}

export const puppeteerNamespace: (options: WrapperOptions) => MapClass<PuppeteerNamespace> = (options) => {
  return {
    Locator: {
      race: (locators) => locatorWrapperFn(ppt.Locator.race(locators), options),
    },
    Puppeteer: {
      customQueryHandlerNames() {
        return ppt.Puppeteer.customQueryHandlerNames()
      },
      clearCustomQueryHandlers() {
        return ppt.Puppeteer.clearCustomQueryHandlers()
      },
      registerCustomQueryHandler(name, queryHandler) {
        return ppt.Puppeteer.registerCustomQueryHandler(name, queryHandler)
      },
      unregisterCustomQueryHandler(name) {
        return ppt.Puppeteer.unregisterCustomQueryHandler(name)
      },
    },
    Connection: {
      fromSession(session) {
        return ppt.Connection.fromSession(session)
      },
    },
  }
}

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-puppeteer
export const puppeteerNodeWrapper = createWrapper<ppt.PuppeteerNode>('PuppeteerNode', (puppeteer, options) => {
  return {
    ...puppeteerNamespace(options),
    connect: NotSupportFunction('puppeteer.connect'),
    launch: () => Promise.resolve(browserWrapper.wrap(options.browser, options)),
    executablePath: NotSupportFunction('puppeteer.executablePath'),
    product: puppeteer.product,
    defaultArgs: NotSupportFunction('puppeteer.executablePath'),
    lastLaunchedProduct: puppeteer.lastLaunchedProduct,
    defaultProduct: puppeteer.defaultProduct,
    trimCache: () => puppeteer.trimCache(),
  }
})
