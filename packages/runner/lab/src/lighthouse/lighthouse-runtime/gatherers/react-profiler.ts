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

import { readFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { promisify } from 'util'

import Gatherer from 'lighthouse/types/gatherer'

import { createBrowser, detectReactDom, Driver, generateProfilingBundle, isProfilingBuild } from '../../helpers'

type GeneratedBundle = [url: string, text: string]

export class ReactProfiler implements LH.PerfseeGathererInstance {
  static SEND = 'reactDevltoolsBridgeWallSend'
  static SAVED_PREFERENCE = {
    appendComponentStack: false,
    breakOnConsoleErrors: false,
    componentFilters: [],
    showInlineWarningsAndErrors: false,
    hideConsoleLogsInStrictMode: true,
  }
  static bundleToReplace?: GeneratedBundle
  static lastProcessedUrl?: string

  static REACT_DEVTOOLS_INJECT_SCRIPT = readFileSync(join(__dirname, '../../../inject-react-devtools.js'), 'utf-8')

  static async findReactDOMScriptAndGenerateProfilingBundle(url: string) {
    if (this.lastProcessedUrl === url) {
      return
    }
    const reactDOMProfilingBuild = await readFile(join(__dirname, '../../../react-dom-profiling-build.js'), 'utf-8')

    const browser = await createBrowser()
    const page = await browser.newPage()

    const reactDomFound = new Promise<GeneratedBundle | undefined>((resolve) => {
      page.on('response', (response) => {
        const url = response.url()
        if (url.endsWith('.js')) {
          void response.text().then((text) => {
            if (detectReactDom(text)) {
              if (isProfilingBuild(text)) {
                resolve(undefined)
              } else {
                const generatedBundle = generateProfilingBundle(text, reactDOMProfilingBuild)
                resolve([url, generatedBundle])
              }
            }
          })
        }
      })
    })

    await page.goto(url)
    const result = await Promise.race([page.waitForNetworkIdle(), reactDomFound])
    await browser.close()
    this.lastProcessedUrl = url
    this.bundleToReplace = result as GeneratedBundle | undefined
  }

  name = 'ReactProfiler' as const

  private isProfiling = false
  private readonly renderQueue = new Set<number>()
  private readonly rendererIdsThatReportedProfilingData = new Set<number>()
  private driver?: Driver
  private readonly profilingDataPromise: Promise<LH.ReactProfilingResult | null>
  private resolveProfilngData!: (result: LH.ReactProfilingResult | null) => void

  constructor(private readonly url: string) {
    this.profilingDataPromise = new Promise((resolve) => {
      this.resolveProfilngData = resolve
    })
  }

  async beforePass(ctx: Gatherer.PassContext) {
    const driver = ctx.driver as Driver
    await ReactProfiler.findReactDOMScriptAndGenerateProfilingBundle(this.url)
    if (!ReactProfiler.bundleToReplace) {
      return this.resolveProfilngData(null)
    }

    this.driver = driver
    const [bundleUrl, profilingBuildText] = ReactProfiler.bundleToReplace

    driver.on('Network.requestIntercepted', ({ interceptionId, request }) => {
      if (request.url === bundleUrl) {
        const responseBody = profilingBuildText

        const responseHeaders = [
          `Date: ${new Date().toUTCString()}`,
          `Content-Length: ${responseBody.length}`,
          `Content-Type: application/javascript`,
        ]
        const rawResponse = `HTTP/1.1 200 OK\r\n` + responseHeaders.join('\r\n') + '\r\n\r\n' + responseBody
        void driver.sendCommand('Network.continueInterceptedRequest', {
          interceptionId,
          rawResponse: btoa(rawResponse),
        })
      } else {
        void driver.sendCommand('Network.continueInterceptedRequest', { interceptionId })
      }
    })

    await driver.sendCommand('Network.setRequestInterception', {
      patterns: [{ urlPattern: bundleUrl, resourceType: 'Script', interceptionStage: 'HeadersReceived' }],
    })

    // expose function to page
    await driver.sendCommand('Runtime.addBinding', { name: ReactProfiler.SEND })
    await driver.sendCommand('Page.addScriptToEvaluateOnNewDocument', {
      source: `
      const callCDP = window.${ReactProfiler.SEND};
      Object.assign(window, {
        ${ReactProfiler.SEND}(...args) {
          callCDP(JSON.stringify({args}));
        },
      });
    `,
    })
    driver.on('Runtime.bindingCalled', (e) => {
      if (e.name === ReactProfiler.SEND) {
        const { args } = JSON.parse(e.payload) as { args: [string, any] }
        this.onMessage(...args)
      }
    })

    const injection = `
    ${ReactProfiler.REACT_DEVTOOLS_INJECT_SCRIPT};
    ReactDevtoolsBackend.initialize(window);
      const wall = {
        listen(fn) {
          const onMessage = ({data}) => {
            window.logMessage += '\\n' + JSON.stringify(data);
            fn(data);
          };
          window.addEventListener('message', onMessage);
          return () => {
            window.removeEventListener('message', onMessage);
          };
        },
        send: ${ReactProfiler.SEND},
      };
      window.logMessage = '';
      const bridge = ReactDevtoolsBackend.createBridge(window, wall);
      ReactDevtoolsBackend.activate(window, { bridge });
      window.postMessage({ event: 'savedPreferences', payload: ${JSON.stringify(ReactProfiler.SAVED_PREFERENCE)} });
      window.postMessage({ event: 'startProfiling', payload: true });
    `
    await driver.sendCommand('Page.addScriptToEvaluateOnNewDocument', { source: injection })
  }

  pass() {}

  async afterPass() {
    this.send('stopProfiling')
    return Promise.race([this.profilingDataPromise, promisify(setTimeout)(10000).then(() => null)])
  }

  private send(event: string, payload?: any) {
    void this.driver?.evaluateAsync(`window.postMessage(${JSON.stringify({ event, payload })})`)
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
        if (this.isProfiling) {
          this.rendererIdsThatReportedProfilingData.add(rendererId)
        }
        break
      }
      case 'profilingData': {
        const { rendererId } = payload
        this.renderQueue.delete(rendererId)
        this.resolveProfilngData(payload)
        break
      }
      default:
        return
    }
  }
}
