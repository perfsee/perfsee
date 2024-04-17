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

import { JSHandle } from 'puppeteer-core'

import { elementHandleWrapper } from './element-handle'
import { createWrapper, Wrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-jshandle
export const jsHandleWrapper: Wrapper<JSHandle<any>> = createWrapper<JSHandle<any>>('JSHandle', (jsHandle, options) => {
  return {
    asElement: () => {
      const element = jsHandle.asElement()
      return element && elementHandleWrapper.wrap(element, options)
    },
    dispose: () => jsHandle.dispose(),
    evaluate: (pageFunction, ...args) => jsHandle.evaluate(pageFunction, ...args),
    evaluateHandle: async (pageFunction, ...args) =>
      jsHandleWrapper.wrap(await jsHandle.evaluateHandle(pageFunction, ...args), options) as any,
    getProperties: async () => {
      const newMap = new Map<string, JSHandle<unknown>>()
      const properties = await jsHandle.getProperties()
      for (const [name, handle] of properties) {
        newMap.set(name, jsHandleWrapper.wrap(handle, options))
      }

      return newMap
    },
    getProperty: async (propertyName: any) => {
      const handle = await jsHandle.getProperty(propertyName)
      return handle && jsHandleWrapper.wrap(handle, options)
    },
    jsonValue: () => jsHandle.jsonValue(),
    move: () => jsHandle.move(),
    remoteObject: () => jsHandle.remoteObject(),
  }
})
