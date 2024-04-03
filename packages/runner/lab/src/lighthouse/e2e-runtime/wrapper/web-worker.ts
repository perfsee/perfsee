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

import { WebWorker } from 'puppeteer-core'

import { jsHandleWrapper } from './js-handle'
import { createWrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-webworker
export const webWorkerWrapper = createWrapper<WebWorker>('WebWorker', (webWorker, options) => {
  return {
    evaluate: (pageFunction, ...args) => webWorker.evaluate(pageFunction, ...args),
    evaluateHandle: async (pageFunction, ...args) =>
      jsHandleWrapper.wrap(await webWorker.evaluateHandle(pageFunction, ...args), options) as any,
    url: () => webWorker.url(),
    on: (type, handler) => webWorker.on(type, handler),
    off: (type, handler) => webWorker.off(type, handler),
    removeListener: (type, handler) => webWorker.removeListener(type, handler),
    addListener: (type, handler) => webWorker.addListener(type, handler),
    emit: (type, handler) => webWorker.emit(type, handler),
    once: (type, handler) => webWorker.once(type, handler),
    listenerCount: (type) => webWorker.listenerCount(type),
    removeAllListeners: (type) => webWorker.removeAllListeners(type),
    client: webWorker.client,
  }
})
