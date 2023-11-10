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

import { Page } from 'puppeteer-core'

import { accessibilityWrapper } from './accessibility'
import { browserWrapper } from './browser'
import { coverageWrapper } from './coverage'
import { elementHandleWrapper } from './element-handle'
import { frameWrapper } from './frame'
import { httpRequestWrapper } from './http-request'
import { httpResponseWrapper } from './http-response'
import { jsHandleWrapper } from './js-handle'
import { keyboardWrapper } from './keyboard'
import { mouseWrapper } from './mouse'
import { touchscreenWrapper } from './touchscreen'
import { tracingWrapper } from './tracing'
import { IgnoreFunction, NotSupportFunction } from './utils'
import { webWorkerWrapper } from './web-worker'
import { createWrapper, Wrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-page
// @ts-expect-error
export const pageWrapper: Wrapper<Page> = createWrapper<Page>('Page', (page, options) => {
  const flow = options.flow
  return {
    target: NotSupportFunction,
    close: IgnoreFunction,
    on: NotSupportFunction,
    off: NotSupportFunction,
    removeListener: NotSupportFunction,
    addListener: NotSupportFunction,
    emit: NotSupportFunction,
    once: NotSupportFunction,
    isDragInterceptionEnabled: () => page.isDragInterceptionEnabled(),
    isJavaScriptEnabled: () => page.isJavaScriptEnabled(),
    waitForFileChooser: NotSupportFunction,
    setGeolocation: (options) => page.setGeolocation(options),
    client: NotSupportFunction,
    browser: () => browserWrapper.wrap(page.browser(), options),
    browserContext: NotSupportFunction,
    mainFrame: () => frameWrapper.wrap(page.mainFrame(), options),
    keyboard: keyboardWrapper.wrap(page.keyboard, options),
    touchscreen: touchscreenWrapper.wrap(page.touchscreen, options),
    coverage: coverageWrapper.wrap(page.coverage, options),
    tracing: tracingWrapper.wrap(page.tracing, options),
    accessibility: accessibilityWrapper.wrap(page.accessibility, options),
    frames: () => page.frames().map((f) => frameWrapper.wrap(f, options)),
    workers: () => page.workers().map((w) => webWorkerWrapper.wrap(w, options)),
    setRequestInterception: (enabled) => page.setRequestInterception(enabled),
    setDragInterception: (enabled) => page.setDragInterception(enabled),
    setOfflineMode: options.ignoreEmulate ? IgnoreFunction : (enabled) => page.setOfflineMode(enabled),
    emulateNetworkConditions: (options) => page.emulateNetworkConditions(options),
    setDefaultNavigationTimeout: (timeout) => page.setDefaultNavigationTimeout(timeout),
    setDefaultTimeout: (timeout) => page.setDefaultTimeout(timeout),
    $: async (selector) => elementHandleWrapper.wrapOrNull(await page.$(selector), options),
    evaluateHandle: async (pageFunction, ...args) =>
      jsHandleWrapper.wrap(await page.evaluateHandle(pageFunction, ...args), options) as any,
    queryObjects: async (prototypeHandle) => jsHandleWrapper.wrap(await page.queryObjects(prototypeHandle), options),
    $eval: (selector, pageFunction, ...args) => page.$eval(selector, pageFunction, ...args),
    $$eval: (selector, pageFunction, ...args) => page.$$eval(selector, pageFunction, ...args),
    $$: async (selector) => elementHandleWrapper.wrapAll(await page.$$(selector), options),
    // @ts-expect-error
    $x: async (expression) => elementHandleWrapper.wrapAll(await page.$x(expression), options),
    cookies: (...urls) => page.cookies(...urls),
    deleteCookie: (...cookies) => page.deleteCookie(...cookies),
    setCookie: (...cookies) => page.setCookie(...cookies),
    addScriptTag: async (fnOptions) => elementHandleWrapper.wrap(await page.addScriptTag(fnOptions), options),
    addStyleTag: async (fnOptions) => elementHandleWrapper.wrap(await page.addStyleTag(fnOptions), options),
    exposeFunction: NotSupportFunction,
    authenticate: (credentials) => page.authenticate(credentials),
    setExtraHTTPHeaders: (headers) => page.setExtraHTTPHeaders(headers),
    setUserAgent: options.ignoreEmulate
      ? IgnoreFunction
      : (userAgent, userAgentMetadata) => page.setUserAgent(userAgent, userAgentMetadata),
    metrics: () => page.metrics(),
    url: () => page.url(),
    content: () => page.content(),
    setContent: (html, options) => page.setContent(html, options),
    goto: async (url, options) => {
      if (flow) {
        await flow?.navigate(url)
      } else {
        return page.goto(url, options)
      }
      return null as any
    },
    reload: async (reloadOptions) => {
      await flow?.startAction('reload')
      return httpResponseWrapper.wrapOrNull(await page.reload(reloadOptions), options)
    },
    waitForNavigation: async (navigationOptions) =>
      httpResponseWrapper.wrapOrNull(await page.waitForNavigation(navigationOptions), options),
    waitForRequest: async (urlOrPredicate, fnOptions) =>
      httpRequestWrapper.wrap(await page.waitForRequest(urlOrPredicate, fnOptions), options),
    waitForResponse: async (urlOrPredicate, fnOptions) =>
      httpResponseWrapper.wrap(await page.waitForResponse(urlOrPredicate, fnOptions), options),
    waitForNetworkIdle: async (options) => page.waitForNetworkIdle(options),
    goBack: async (goBackOptions) => {
      await flow?.startAction('goBack')
      return httpResponseWrapper.wrapOrNull(await page.goBack(goBackOptions), options)
    },
    goForward: async (goForwardOptions) => {
      await flow?.startAction('goForward')
      return httpResponseWrapper.wrapOrNull(await page.goForward(goForwardOptions), options)
    },
    bringToFront: async () => page.bringToFront(),
    emulate: IgnoreFunction,
    setJavaScriptEnabled: (enabled) => page.setJavaScriptEnabled(enabled),
    setBypassCSP: (enabled) => page.setBypassCSP(enabled),
    emulateMediaType: options.ignoreEmulate ? IgnoreFunction : (type) => page.emulateMediaType(type),
    emulateCPUThrottling: options.ignoreEmulate
      ? IgnoreFunction
      : (throttling) => page.emulateCPUThrottling(throttling),
    emulateMediaFeatures: options.ignoreEmulate
      ? IgnoreFunction
      : options.ignoreEmulate
      ? IgnoreFunction
      : (features) => page.emulateMediaFeatures(features),
    emulateTimezone: options.ignoreEmulate ? IgnoreFunction : (timezoneId) => page.emulateTimezone(timezoneId),
    emulateIdleState: options.ignoreEmulate ? IgnoreFunction : (options) => page.emulateIdleState(options),
    emulateVisionDeficiency: options.ignoreEmulate ? IgnoreFunction : (type) => page.emulateVisionDeficiency(type),
    setViewport: options.ignoreEmulate ? IgnoreFunction : (viewport) => page.setViewport(viewport),
    viewport: () => page.viewport(),
    evaluate: (pageFunction, ...args) => page.evaluate(pageFunction, ...args),
    evaluateOnNewDocument: (pageFunction, ...args) => page.evaluateOnNewDocument(pageFunction, ...args),
    setCacheEnabled: (enabled) => page.setCacheEnabled(enabled),
    screenshot: async (options) => page.screenshot(options),
    createPDFStream: NotSupportFunction,
    pdf: (options) => page.pdf(options),
    title: () => page.title(),
    isClosed: () => page.isClosed(),
    mouse: mouseWrapper.wrap(page.mouse, options),
    click: async (selector, clickOptions) => {
      await flow?.startAction('click')
      return page.click(selector, clickOptions)
    },
    focus: async (selector) => {
      await flow?.startAction('focus')
      return page.focus(selector)
    },
    hover: async (selector) => {
      await flow?.startAction('hover')
      return page.hover(selector)
    },
    select: async (selector, ...values) => {
      await flow?.startAction('select')
      return page.select(selector, ...values)
    },
    tap: async (selector) => {
      await flow?.startAction('tap')
      return page.tap(selector)
    },
    type: async (selector, text, options) => {
      await flow?.startAction('type')
      return page.type(selector, text, options)
    },
    waitForTimeout: async (timeout) => page.waitForTimeout(timeout),
    waitForSelector: async (selector, fnOptions) =>
      elementHandleWrapper.wrapOrNull(await page.waitForSelector(selector, fnOptions), options),
    waitForXPath: async (xpath, fnOptions) =>
      // @ts-expect-error
      elementHandleWrapper.wrapOrNull(await page.waitForXPath(xpath, fnOptions), options),
    waitForFunction: async (pageFunction, fnOptions, ...args) =>
      jsHandleWrapper.wrap(await page.waitForFunction(pageFunction, fnOptions, ...args), options),
    listenerCount: NotSupportFunction,
    removeAllListeners: NotSupportFunction,
    waitForFrame: async (urlOrPredicate, fnOptions) =>
      frameWrapper.wrap(await page.waitForFrame(urlOrPredicate, fnOptions), options),
    isServiceWorkerBypassed: () => page.isServiceWorkerBypassed(),
    setBypassServiceWorker: (val) => page.setBypassServiceWorker(val),
    createCDPSession: () => page.createCDPSession(),
    getDefaultTimeout: () => page.getDefaultTimeout(),
    locator: NotSupportFunction,
    removeScriptToEvaluateOnNewDocument: (id) => page.removeScriptToEvaluateOnNewDocument(id),
    removeExposedFunction: (id) => page.removeExposedFunction(id),
    screencast: (options) => page.screencast(options),
    waitForDevicePrompt: NotSupportFunction,
  }
})
