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

import { EventEmitter, Locator, LocatorEvent } from 'puppeteer-core'

import { elementHandleWrapper } from './element-handle'
import { jsHandleWrapper } from './js-handle'
import { WrapperOptions } from './options'
import { DEFAULT_APPEND_TIMEOUT, getContentFromHandle } from './utils'
import { Wrapper, createWrapper } from './wrapper'

export const locatorWrapperFn = (locator: Locator<any>, options: WrapperOptions) => {
  const OriginClass = Object.getPrototypeOf(locator).constructor
  const emitter = new EventEmitter<{ action: undefined }>()
  class WrappedLocator extends OriginClass {
    listenerCount = locator.listenerCount

    get timeout() {
      return locator.timeout
    }

    removeListener(type: any, handler: any) {
      emitter.removeListener(type, handler)
      return this
    }
    removeAllListeners(type: any) {
      emitter.removeAllListeners(type)
      return this
    }
    addListener(type: any, handler: any) {
      emitter.addListener(type, handler)
      return this
    }
    setWaitForStableBoundingBox(value: any) {
      locator.setWaitForEnabled(value)
      return this as any as Locator<any>
    }
    setEnsureElementIsInTheViewport(value: any) {
      locator.setEnsureElementIsInTheViewport(value)
      return this as any as Locator<any>
    }
    setTimeout(value: any) {
      locator.setTimeout(value + DEFAULT_APPEND_TIMEOUT)
      return this as any as Locator<any>
    }
    setWaitForEnabled(value: any) {
      locator.setWaitForEnabled(value)
      return this as any as Locator<any>
    }
    setVisibility(value: any) {
      locator.setVisibility(value)
      return this as any as Locator<any>
    }
    async scroll(fnOptions: any) {
      emitter.emit(LocatorEvent.Action, undefined)
      const handle = await locator.waitHandle()
      const content = await getContentFromHandle(handle)
      await options.flow?.startAction(`scroll ${content}`)
      return locator.scroll(fnOptions)
    }
    wait(fnOptions: any) {
      return locator.wait(fnOptions)
    }
    async waitHandle(fnOptions: any) {
      const handle = await locator.waitHandle(fnOptions)
      const element = handle.asElement()
      if (element) {
        return elementHandleWrapper.wrap(element, options) as any
      } else {
        return jsHandleWrapper.wrap(handle, options) as any
      }
    }
    async click(fnOptions: any) {
      emitter.emit(LocatorEvent.Action, undefined)
      const handle = await locator.waitHandle()
      const content = await getContentFromHandle(handle)
      await options.flow?.startAction(`click ${content}`)
      return locator.click(fnOptions)
    }
    clone() {
      return locatorWrapper.wrap(locator.clone(), options)
    }
    map(mapper: any) {
      return locatorWrapper.wrap(locator.map(mapper), options)
    }
    async fill(value: any, fnOptions: any) {
      emitter.emit(LocatorEvent.Action, undefined)
      const handle = await locator.waitHandle()
      const content = await getContentFromHandle(handle)
      await options.flow?.startAction(`fill ${content} with \`${value}\``)
      return locator.fill(value, fnOptions)
    }
    filter(predict: any) {
      return locatorWrapper.wrap(locator.filter(predict), options)
    }
    async hover(fnOptions: any) {
      emitter.emit(LocatorEvent.Action, undefined)
      const handle = await locator.waitHandle()
      const content = await getContentFromHandle(handle)
      await options.flow?.startAction(`hover ${content}`)
      return locator.hover(fnOptions)
    }
    on(type: any, handler: any) {
      emitter.on(type, handler)
      return this
    }
    off(type: any, handler: any) {
      emitter.off(type, handler)
      return this
    }
    once(type: any, handler: any) {
      emitter.once(type, handler)
      return this
    }
    emit(type: any, event: any) {
      return emitter.emit(type, event)
    }
  }

  return new WrappedLocator() as any
}

export const locatorWrapper: Wrapper<Locator<any>> = createWrapper<Locator<any>>('locator', locatorWrapperFn)
