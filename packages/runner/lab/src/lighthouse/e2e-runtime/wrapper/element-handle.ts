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

import { ElementHandle, JSHandle } from 'puppeteer-core'

import { frameWrapper } from './frame'
import { jsHandleWrapper } from './js-handle'
import { getContentFromHandle, NotSupportFunction } from './utils'
import { createWrapper, Wrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-elementhandle
export const elementHandleWrapper: Wrapper<ElementHandle<any>> = createWrapper<ElementHandle<any>>(
  'ElementHandle',
  (elementHandle, options) => {
    const flow = options.flow
    return {
      $: async (selector) => {
        const handle = await elementHandle.$(selector)
        return handle && elementHandleWrapper.wrap(handle, options)
      },
      $$: async (selector) => (await elementHandle.$$(selector)).map((e) => elementHandleWrapper.wrap(e, options)),
      $$eval: (selector, pageFunction, ...args) => elementHandle.$$eval(selector, pageFunction, ...args),
      $eval: (selector, pageFunction, ...args) => elementHandle.$eval(selector, pageFunction, ...args),
      $x: async (expression) => (await elementHandle.$x(expression)).map((e) => elementHandleWrapper.wrap(e, options)),
      asElement: () => {
        const element = elementHandle.asElement()
        return element && elementHandleWrapper.wrap(element, options)
      },
      boundingBox: () => elementHandle.boundingBox(),
      boxModel: () => elementHandle.boxModel(),
      clickablePoint: (offset) => elementHandle.clickablePoint(offset),
      contentFrame: async () => {
        const frame = await elementHandle.contentFrame()
        return frame && (frameWrapper.wrap(frame, options) as any)
      },
      dispose: () => elementHandle.dispose(),
      click: async (options) => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`click ${content}`)
        return elementHandle.click(options)
      },
      drag: async (target) => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`drag ${content}`)
        return elementHandle.drag(target)
      },
      dragAndDrop: async (target, options) => {
        await flow?.startAction('dragAndDrop')
        return elementHandle.dragAndDrop(target, options)
      },
      dragEnter: async (data) => {
        await flow?.startAction('dragEnter')
        return elementHandle.dragEnter(data)
      },
      dragOver: async (data) => {
        await flow?.startAction('dragOver')
        return elementHandle.dragOver(data)
      },
      drop: async (data: any) => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`drop ${content}`)
        return elementHandle.drop(data)
      },
      focus: async () => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`focus ${content}`)
        return elementHandle.focus()
      },
      hover: async () => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`hover ${content}`)
        return elementHandle.hover()
      },
      press: async (key, options) => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`press ${content} with key \`${key}\``)
        return elementHandle.press(key, options)
      },
      tap: async () => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`tap ${content}`)
        return elementHandle.tap()
      },
      type: async (text, options) => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`type ${content} with text \`${text}\``)
        return elementHandle.type(text, options)
      },
      evaluate: (pageFunction, ...args) => elementHandle.evaluate(pageFunction, ...args),
      evaluateHandle: async (pageFunction, ...args) =>
        // @ts-expect-error
        elementHandleWrapper.wrap(await elementHandle.evaluateHandle(pageFunction, ...args), options) as any,
      getProperties: async () => {
        const newMap = new Map<string, JSHandle<unknown>>()
        const properties = await elementHandle.getProperties()
        for (const [name, handle] of properties) {
          newMap.set(name, jsHandleWrapper.wrap(handle, options))
        }

        return newMap
      },
      getProperty: async (propertyName: any) => {
        const handle = await elementHandle.getProperty(propertyName)
        return handle && jsHandleWrapper.wrap(handle, options)
      },
      isIntersectingViewport: (options) => elementHandle.isIntersectingViewport(options),
      jsonValue: () => elementHandle.jsonValue(),
      screenshot: (options) => elementHandle.screenshot(options) as any,
      select: async (...values) => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`${content} select \`${values.join(',')}\``)
        return elementHandle.select(...values)
      },
      toString: () => elementHandle.toString(),
      uploadFile: NotSupportFunction('elementHandle.uploadFile'),
      waitForSelector: async (selector, fnOptions) =>
        elementHandleWrapper.wrapOrNull(await elementHandle.waitForSelector(selector, fnOptions), options),
      waitForXPath: async (selector, fnOptions) =>
        elementHandleWrapper.wrapOrNull(await elementHandle.waitForXPath(selector, fnOptions), options),
      touchStart: async () => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`touchStart ${content}`)
        return elementHandle.touchStart()
      },
      touchEnd: async () => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`touchEnd ${content}`)
        return elementHandle.touchEnd()
      },
      touchMove: async () => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`touchMove ${content}`)
        return elementHandle.touchMove()
      },
      frame: elementHandle.frame,
      isVisible: () => elementHandle.isVisible(),
      isHidden: () => elementHandle.isHidden(),
      toElement: async (tagName) =>
        elementHandleWrapper.wrapOrNull(await elementHandle.toElement(tagName), options) as any,
      autofill: async (data) => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`autofill ${content}`)
        return elementHandle.autofill(data)
      },
      scrollIntoView: async () => {
        const content = await getContentFromHandle(elementHandle)
        await flow?.startAction(`${content} scrollIntoView`)
        return elementHandle.scrollIntoView()
      },
      move: () => elementHandle.move(),
      remoteObject: () => elementHandle.remoteObject(),
    }
  },
)
