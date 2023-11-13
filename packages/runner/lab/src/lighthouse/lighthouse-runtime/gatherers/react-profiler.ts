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

import { promisify } from 'util'

import Protocol from 'devtools-protocol'
import Gatherer from 'lighthouse/types/gatherer'
import { Browser, HTTPResponse } from 'puppeteer-core'

import { AbstractJobLogger } from '@perfsee/job-runner-shared'
import { ReactDevtoolProfilingDataExport } from '@perfsee/shared'

import {
  detectReactDom,
  detectVersion,
  DEVICE_DESCRIPTORS,
  fetchReactDom,
  generateProfilingBundle,
  isProfilingBuild,
  prepareProfilingDataFrontendFromBackendAndStore,
  prepareReactDevtoolProfilingDataExport,
} from '../../helpers'

import { DEVTOOLS_INJECTION } from './devtools-injection'
import { GathererInstance } from './gatherer'

export class ReactProfiler extends GathererInstance {
  static SEND = 'reactDevltoolsBridgeWallSend'
  static RESOLVE_LOCATION = 'reactDevtoolsResolveLocation'
  static FUNCTION_MAP = 'reactDevltoolsFunctionMap'

  static SAVED_PREFERENCE = {
    appendComponentStack: false,
    breakOnConsoleErrors: false,
    componentFilters: [],
    showInlineWarningsAndErrors: false,
    hideConsoleLogsInStrictMode: true,
  }
  static bundleToReplace = new Map<string, string>()
  static lastProcessedUrl?: string

  static async findReactDOMScriptAndGenerateProfilingBundle(url: string, browser: Browser, logger: AbstractJobLogger) {
    if (this.lastProcessedUrl === url) {
      return
    }
    this.reset()

    const page = await browser.newPage()

    await page.setViewport(DEVICE_DESCRIPTORS['no'].viewport) // always use default view port

    const onResponse = async (response: HTTPResponse) => {
      const url = response.url()
      if (!url.endsWith('.js') || this.bundleToReplace.has(url)) {
        return
      }
      const text = await response.text()

      if (url.endsWith('react-dom.production.min.js') || url.endsWith('react-dom.production.js')) {
        const profilingBuild = await fetchReactDom(detectVersion(text), 'umd')
        this.bundleToReplace.set(url, profilingBuild)
      } else if (detectReactDom(text)) {
        if (isProfilingBuild(text)) {
          return
        }

        const generatedBundle = await generateProfilingBundle(text)
        generatedBundle && this.bundleToReplace.set(url, generatedBundle)
      }
    }

    page.on('response', (response) => {
      onResponse(response).catch((e) => logger.error('Generating profiling build failed.', { error: e }))
    })

    await page.goto(url)
    await Promise.race([promisify(setTimeout)(10000), page.waitForNetworkIdle()])
    await page.close()
    this.lastProcessedUrl = url
  }

  static reactDetected() {
    return this.bundleToReplace.size > 0
  }

  static reset() {
    this.bundleToReplace.clear()
  }

  private isProfiling = false
  private readonly renderQueue = new Set<number>()
  private readonly rendererIdsThatReportedProfilingData = new Set<number>()
  private readonly inProgressOperationsByRootID = new Map<number, number[][]>()

  private driver?: LH.Gatherer.Driver

  private readonly profilingDataPromise: Promise<ReactDevtoolProfilingDataExport | null>
  private resolveProfilngData!: (result: ReactDevtoolProfilingDataExport | null) => void

  private readonly teardowns: (() => Promise<void>)[] = []
  private result?: ReactDevtoolProfilingDataExport | null

  constructor() {
    super()
    this.profilingDataPromise = new Promise((resolve) => {
      this.resolveProfilngData = resolve
    })
  }

  async startInstrumentation(ctx: Gatherer.Context) {
    const driver = ctx.driver
    if (!ReactProfiler.bundleToReplace) {
      this.resolveProfilngData(null)
      return
    }

    this.driver = driver

    this.teardowns.push(
      await this.interceptRequest(),
      await this.injectSendFunction(),
      await this.injectResolveFiberLocationFunction(),
      await this.injectDevtoolsBackendRuntime(),
    )
  }

  async stopInstrumentation() {
    this.result = await Promise.race([this.profilingDataPromise, promisify(setTimeout)(10000).then(() => null)])
  }

  async getArtifact() {
    await Promise.all(this.teardowns.map((t) => t()))
    return Promise.resolve(this.result || null)
  }

  private send(event: string, payload?: any) {
    void this.driver?.executionContext.evaluateAsync(`window.postMessage(${JSON.stringify({ event, payload })})`)
  }

  private async injectDevtoolsBackendRuntime() {
    const driver = this.driver!.defaultSession
    const injection = `
    ${DEVTOOLS_INJECTION};
    ReactDevtoolsBackend.initialize(window);
    const wall = {
      listen(fn) {
        const onMessage = ({data}) => {
          fn(data);
        };
        window.addEventListener('message', onMessage);
        return () => {
          window.removeEventListener('message', onMessage);
        };
      },
      send: ${ReactProfiler.SEND},
    };
    const bridge = ReactDevtoolsBackend.createBridge(window, wall);
    ReactDevtoolsBackend.activate(window, { bridge });
    window.postMessage({ event: 'savedPreferences', payload: ${JSON.stringify(ReactProfiler.SAVED_PREFERENCE)} });
    window.postMessage({ event: 'startProfiling', payload: true });

    let timer;
    const observer = new PerformanceObserver((list) => {
      clearTimeout(timer);
      timer = setTimeout(() => window.postMessage({ event: 'stopProfiling' }), 3000);
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
    `
    const { identifier } = await driver.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source: injection })

    return () => driver.sendCommand('Page.removeScriptToEvaluateOnNewDocument', { identifier })
  }

  private async interceptRequest() {
    const driver = this.driver!.defaultSession

    const onRequestIntercepted = ({ interceptionId, request }: LH.CrdpEvents['Network.requestIntercepted'][0]) => {
      if (ReactProfiler.bundleToReplace.has(request.url)) {
        const responseBody = ReactProfiler.bundleToReplace.get(request.url)!

        const responseHeaders = [
          `Date: ${new Date().toUTCString()}`,
          `Content-Length: ${responseBody.length}`,
          `Content-Type: application/javascript`,
        ]
        const rawResponse = `HTTP/1.1 200 OK\r\n` + responseHeaders.join('\r\n') + '\r\n\r\n' + responseBody
        void driver.sendCommand('Network.continueInterceptedRequest', {
          interceptionId,
          rawResponse: Buffer.from(rawResponse).toString('base64'),
        })
      } else {
        void driver.sendCommand('Network.continueInterceptedRequest', { interceptionId })
      }
    }

    driver.on('Network.requestIntercepted', onRequestIntercepted)

    await driver.sendCommand('Network.setRequestInterception', {
      patterns: [...ReactProfiler.bundleToReplace.keys()].map(
        (url): Protocol.Network.RequestPattern => ({
          urlPattern: url,
          interceptionStage: 'HeadersReceived',
        }),
      ),
    })

    return async () => {
      driver.off('Network.requestIntercepted', onRequestIntercepted)
      await driver.sendCommand('Network.setRequestInterception', { patterns: [] })
    }
  }

  private async injectSendFunction() {
    const driver = this.driver!.defaultSession
    // expose function to page
    await driver.sendCommand('Runtime.addBinding', { name: ReactProfiler.SEND })

    const { identifier } = await driver.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      const callCDP = window.${ReactProfiler.SEND};
      Object.assign(window, {
        ${ReactProfiler.SEND}(...args) {
          callCDP(JSON.stringify({args}));
        },
      });
    `,
    })

    const onBindingCalled = (e: Protocol.Runtime.BindingCalledEvent) => {
      if (e.name === ReactProfiler.SEND) {
        const { args } = JSON.parse(e.payload) as { args: [string, any] }
        this.onMessage(...args)
      }
    }
    driver.on('Runtime.bindingCalled', onBindingCalled)

    return async () => {
      await driver.sendCommand('Runtime.removeBinding', { name: ReactProfiler.SEND })
      await driver.sendCommand('Page.removeScriptToEvaluateOnNewDocument', { identifier })
      driver.off('Runtime.bindingCalled', onBindingCalled)
    }
  }

  private async injectResolveFiberLocationFunction() {
    const driver = this.driver!.defaultSession
    const fiberLocations: string[] = []
    const { identifier } = await driver.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      window.${ReactProfiler.FUNCTION_MAP} = [];
      let resolveLocationId = 0
      Object.assign(window, {
        ${ReactProfiler.RESOLVE_LOCATION}(func) {
          window.${ReactProfiler.FUNCTION_MAP}.push(func);
          return resolveLocationId++;
        },
      });
    `,
    })

    const scriptCollection: Record<string, string> = {}
    const onScriptParsed = (e: Protocol.Debugger.ScriptParsedEvent) => {
      scriptCollection[e.scriptId] = e.url
    }
    driver.on('Debugger.scriptParsed', onScriptParsed)

    return async () => {
      // collecting function locations
      // this is ran in afterpass phase
      const {
        result: { value: length },
      } = await driver.sendCommand('Runtime.evaluate', {
        expression: `window.${ReactProfiler.FUNCTION_MAP}.length`,
      })
      for (const functionId of Array.from({ length }, (_v, i) => i)) {
        const { result } = await driver.sendCommand('Runtime.evaluate', {
          expression: `window.${ReactProfiler.FUNCTION_MAP}[${functionId}]`,
        })
        const { internalProperties } = await driver.sendCommand('Runtime.getProperties', {
          objectId: result.objectId!,
        })
        const location = internalProperties?.find(({ name }) => name === '[[FunctionLocation]]')?.value?.value
        fiberLocations[functionId] = `${scriptCollection[location.scriptId]}:${location.lineNumber + 1}:${
          location.columnNumber + 1
        }`
      }

      this.result!.fiberLocations = fiberLocations

      await driver.sendCommand('Page.removeScriptToEvaluateOnNewDocument', { identifier })
      driver.off('Debugger.scriptParsed', onScriptParsed)
    }
  }

  private onMessage(event: string, payload: any) {
    switch (event) {
      case 'profilingStatus':
        if (this.isProfiling && !payload) {
          this.rendererIdsThatReportedProfilingData.forEach((rendererID) => {
            if (!this.renderQueue.has(rendererID)) {
              this.renderQueue.add(rendererID)
              this.send('getProfilingData', { rendererID })
            }
          })
        }
        this.isProfiling = payload
        break
      case 'operations': {
        const rendererId = payload[0]
        const rootID = payload[1]
        let profilingOperations = this.inProgressOperationsByRootID.get(rootID)
        if (profilingOperations == null) {
          profilingOperations = [payload]
          this.inProgressOperationsByRootID.set(rootID, profilingOperations)
        } else {
          profilingOperations.push(payload)
        }
        if (this.isProfiling) {
          this.rendererIdsThatReportedProfilingData.add(rendererId)
        }
        break
      }
      case 'profilingData': {
        const { rendererId } = payload
        this.renderQueue.delete(rendererId)
        const profilingDataFrontend = prepareProfilingDataFrontendFromBackendAndStore(
          [payload],
          this.inProgressOperationsByRootID,
        )
        this.resolveProfilngData(prepareReactDevtoolProfilingDataExport(profilingDataFrontend))
        break
      }
      default:
        return
    }
  }
}
