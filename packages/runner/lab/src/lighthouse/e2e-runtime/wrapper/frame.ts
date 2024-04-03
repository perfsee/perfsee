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

import { Frame } from 'puppeteer-core'

import { elementHandleWrapper } from './element-handle'
import { httpResponseWrapper } from './http-response'
import { jsHandleWrapper } from './js-handle'
import { pageWrapper } from './page'
import { NotSupportFunction } from './utils'
import { createWrapper, Wrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-frame
export const frameWrapper: Wrapper<Frame> = createWrapper<Frame>('Frame', (frame, options) => {
  const flow = options.flow
  return {
    $: async (selector) => elementHandleWrapper.wrapOrNull(await frame.$(selector), options),
    $eval: (selector, pageFunction, ...args) => frame.$eval(selector, pageFunction, ...args),
    $$eval: (selector, pageFunction, ...args) => frame.$$eval(selector, pageFunction, ...args),
    $$: async (selector) => elementHandleWrapper.wrapAll(await frame.$$(selector), options),
    $x: async (expression) => elementHandleWrapper.wrapAll(await frame.$x(expression), options),
    addScriptTag: async (fnOptions) => elementHandleWrapper.wrap(await frame.addScriptTag(fnOptions), options),
    addStyleTag: async (fnOptions) => elementHandleWrapper.wrap(await frame.addStyleTag(fnOptions), options),
    childFrames: () => frameWrapper.wrapAll(frame.childFrames(), options),
    click: async (selector, clickOptions) => {
      await flow?.startAction(`click ${selector}`)
      return frame.click(selector, clickOptions)
    },
    content: () => frame.content(),
    evaluate: (pageFunction, ...args) => frame.evaluate(pageFunction, ...args),
    evaluateHandle: async (pageFunction, ...args) =>
      jsHandleWrapper.wrap(await frame.evaluateHandle(pageFunction, ...args), options) as any,
    focus: async (selector) => {
      await flow?.startAction(`focus ${selector}`)
      return frame.focus(selector)
    },
    goto: async (url, gotoOptions) => httpResponseWrapper.wrapOrNull(await frame.goto(url, gotoOptions), options),
    hover: async (selector) => {
      await flow?.startAction(`hover ${selector}`)
      return frame.hover(selector)
    },
    isDetached: () => frame.isDetached(),
    name: () => frame.name(),
    parentFrame: () => frameWrapper.wrapOrNull(frame.parentFrame(), options),
    select: async (selector, ...values) => {
      await flow?.startAction(`${selector} select \`${values.join(',')}\``)
      return frame.select(selector, ...values)
    },
    setContent: (html, options) => frame.setContent(html, options),
    tap: async (selector) => {
      await flow?.startAction(`tap ${selector}`)
      return frame.tap(selector)
    },
    title: () => frame.title(),
    type: async (selector, text, options) => {
      await flow?.startAction(`type ${selector} with text \`${text}\``)
      return frame.type(selector, text, options)
    },
    url: () => frame.url(),
    waitForFunction: async (pageFunction, fnOptions, ...args) => {
      const result = await frame.waitForFunction(pageFunction, fnOptions, ...args)
      const element = result.asElement()
      if (element) {
        return elementHandleWrapper.wrap(element, options) as any
      } else {
        return jsHandleWrapper.wrap(result, options) as any
      }
    },
    waitForNavigation: async (navigationOptions) => {
      // waitForNavigation should never throw
      try {
        return httpResponseWrapper.wrapOrNull(await frame.waitForNavigation(navigationOptions), options)
      } catch (e) {
        options.logger.error(String(e))
        return null
      }
    },
    waitForSelector: async (selector, fnOptions) =>
      elementHandleWrapper.wrapOrNull(await frame.waitForSelector(selector, fnOptions), options),
    waitForTimeout: (ms) => frame.waitForTimeout(ms),
    waitForXPath: async (xpath, fnOptions) =>
      elementHandleWrapper.wrapOrNull(await frame.waitForXPath(xpath, fnOptions), options),
    isOOPFrame: () => frame.isOOPFrame(),
    page: () => pageWrapper.wrap(frame.page(), options),
    locator: (selector: any) => frame.locator(selector),
    detached: false,
    waitForDevicePrompt: NotSupportFunction('frame.waitForDevicePrompt'),
    on: (e, handler) => {
      frame.on(e, handler)
      return this as any
    },
    off: (e, handler) => {
      frame.off(e, handler)
      return this as any
    },
    once: (e, handler) => {
      frame.once(e, handler)
      return this as any
    },
    removeListener: (type, handler) => {
      frame.removeListener(type, handler)
      return this as any
    },
    addListener: (type, handler) => {
      frame.addListener(type, handler)
      return this as any
    },
    emit: (k, e) => frame.emit(k, e),
    removeAllListeners: (type) => frame.removeAllListeners(type),
    listenerCount: (type) => frame.listenerCount(type),
  }
})
