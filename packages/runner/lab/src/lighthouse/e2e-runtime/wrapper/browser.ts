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
    createIncognitoBrowserContext: NotSupportFunction('browser.createIncognitoBrowserContext'),
    browserContexts: NotSupportFunction('browser.browserContexts'),
    defaultBrowserContext: NotSupportFunction('browser.defaultBrowserContex'),
    wsEndpoint: NotSupportFunction('browser.wsEndpoint'),
    newPage: () => Promise.resolve(pageWrapper.wrap(options.page, options)),
    targets: NotSupportFunction('browser.targets'),
    target: NotSupportFunction('browser.target'),
    waitForTarget: NotSupportFunction('browser.waitForTarget'),
    pages: NotSupportFunction('browser.pages'),
    version: () => browser.version(),
    userAgent: () => browser.userAgent(),
    close: IgnoreFunction,
    disconnect: NotSupportFunction('browser.disconnent'),
    isConnected: browser.isConnected,
    on: NotSupportFunction('browser.on'),
    off: NotSupportFunction('browser.off'),
    removeListener: NotSupportFunction('browser.removeListener'),
    addListener: NotSupportFunction('browser.addListener'),
    emit: NotSupportFunction('browser.emit'),
    once: NotSupportFunction('browser.once'),
    listenerCount: NotSupportFunction('browser.listenerCount'),
    removeAllListeners: NotSupportFunction('browser.removeAllListeners'),
    connected: true,
    createBrowserContext: NotSupportFunction('browser.createBrowserContext'),
    debugInfo: browser.debugInfo,
  }
})
