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

import { mkdir, readFile, rm, writeFile } from 'fs/promises'
import { join, dirname, basename } from 'path'

import { groupBy, mapValues, pick } from 'lodash'
import { Target, Page } from 'puppeteer-core'
import { v4 as uuid } from 'uuid'

import { JobWorker, clearProxyCache, dynamicImport, startProxyServer } from '@perfsee/job-runner-shared'
import { LabJobPayload } from '@perfsee/server-common'
import {
  CookieType,
  LighthouseScoreMetric,
  LocalStorageType,
  MetricKeyType,
  MetricType,
  ReactDevtoolProfilingDataExport,
  RequestSchema,
  computeMedianRun,
  getLCPScore,
  getTBTScore,
  getTTI,
  MetricsRecord,
  getMeanValue,
  getPerformance,
  LHTosUserFlowSchema,
  TimelineSchema,
  SessionStorageType,
  getScore,
} from '@perfsee/shared'
import { computeMainThreadTasksWithTimings } from '@perfsee/tracehouse'

import { createSandbox } from './e2e-runtime/sandbox'
import { puppeteerNodeWrapper } from './e2e-runtime/wrapper/puppeteer'
import {
  createBrowser,
  transformHeadersToHostHeaders,
  HostHeaders,
  DEVICE_DESCRIPTORS,
  slimTraceData,
  getLighthouseMetricScores,
  formatCookies,
  DEFAULT_BENCHMARK_INDEX,
  onRequestFactory,
  BrowserOptions,
} from './helpers'
import { lighthouse } from './lighthouse-runtime'
import { ReactProfiler } from './lighthouse-runtime/gatherers'

export abstract class LighthouseJobWorker extends JobWorker<LabJobPayload> {
  protected headers!: HostHeaders
  protected cookies!: CookieType[]
  protected localStorageContent!: LocalStorageType[]
  protected sessionStorageContent!: SessionStorageType[]
  protected reactProfiling!: boolean
  // See https://github.com/GoogleChrome/lighthouse/blob/main/docs/throttling.md#benchmarking-cpu-power
  protected benchmarkIndex: number = DEFAULT_BENCHMARK_INDEX
  protected cpuThrottling = false
  protected cacheDir = `tmp/chrome-cache-${Date.now()}`

  protected async before() {
    await this.prepare()
    await this.warmupPageload()
    return Promise.resolve()
  }

  protected async after() {
    try {
      await rm('tmp', { recursive: true, force: true })
    } catch (e: unknown) {
      this.logger.warn('Failed to clean up tmp dir: ', { error: String(e) })
    }
  }

  protected async audit() {
    await this.wrapLighthouseLogger()
    const lhResult = await this.runLighthouse()

    return this.collectResults(lhResult)
  }

  protected getLighthouseMetricScores(
    audits: Record<string, LH.Audit.Result>,
    timings?: LH.Artifacts.NavigationTraceTimes | null,
    timelines?: TimelineSchema[],
  ) {
    return getLighthouseMetricScores('navigation', audits, timings, timelines)
  }

  protected shouldHaveLcp() {
    return true
  }

  protected async collectResults(lhResult: LH.PerfseeRunnerResult, flowResults?: LHTosUserFlowSchema[]) {
    const { artifacts, lhr } = lhResult

    this.logger.info(`Actual benchmark index: ${lhr.environment.benchmarkIndex}`)

    const screencastStorageKey = await this.uploadScreencast(artifacts.Screencast || null)

    let failedReason = artifacts.PageLoadError?.friendlyMessage?.formattedDefault

    // format request data
    const devtoolsLog = artifacts.DevtoolsLog
    if (!devtoolsLog && !failedReason) {
      failedReason = `No artifacts result. Please check if the url '${this.payload.url}' in this env is accessible.`
      // `devtoolsLogs.defaultPass` doesn't exist when the page is not found(404).
    }

    if (failedReason) {
      return {
        failedReason,
        screencastStorageKey,
      }
    }

    const { requests, requestsBaseTimestamp } = this.getRequests(artifacts, lhr)
    const scripts = this.getScripts(requests)
    const userTimings = this.getUserTimings(artifacts, requestsBaseTimestamp)
    const metrics = this.getMetrics(lhr)
    const { traceData, timings } = await this.computeMainThreadTask(lhr, artifacts)
    // format overview render timeline data
    // @ts-expect-error
    const timelines = (lhr.audits['screenshot-thumbnails'].details?.items ?? []) as TimelineSchema[]
    const metricScores = this.getLighthouseMetricScores(lhr.audits, timings, timelines)

    const jsCoverage = artifacts.JsUsage ?? {}
    const reactProfile = artifacts.ReactProfiler as
      | (ReactDevtoolProfilingDataExport & {
          fiberLocations?: string[]
        })
      | null

    if (this.shouldHaveLcp() && !Number.isFinite(getScore(lhr, 'first-contentful-paint'))) {
      failedReason = 'No valid FCP result emitted.'
    }
    const hasRedirected = (lhr.audits['redirects']?.numericValue || 0) > 0
    if (hasRedirected && !this.payload.lighthouseFlags?.ignoreRedirection) {
      failedReason =
        'Page has redirected, may due to login failure. If you want to ignore redirection, please set lighthouse running flags in the profile.'
    }

    // artifacts
    const lighthouseFile = `snapshots/${uuid()}.json`
    const jsCoverageFile = `js-coverage/${uuid()}.json`
    const reactProfileFile = `react-profile/${uuid()}.json`
    const traceDataFile = `traceData/${uuid()}.json`
    const requestsFile = `requests/${uuid()}.json`
    let lighthouseStorageKey
    let jsCoverageStorageKey
    let reactProfileStorageKey
    let traceDataStorageKey
    let requestsStorageKey

    // delete useless lighthouse data
    // @ts-expect-error
    delete lhr.timing
    // hiding lighthouse running parameters
    // @ts-expect-error
    delete lhr.configSettings

    // hiding network-requests
    // @ts-expect-error
    lhr.audits['network-requests-custom'] = {}

    // hide user timings
    // @ts-expect-error
    lhr.audits['user-timings'] = {}

    try {
      lighthouseStorageKey = await this.client.uploadArtifact(
        lighthouseFile,
        Buffer.from(
          JSON.stringify({
            lighthouseVersion: lhr.lighthouseVersion,
            lhrAudit: lhr.audits,
            lhrCategories: lhr.categories,
            entities: lhr.entities,
            fullPageScreenshot: lhr.fullPageScreenshot,
            stackPacks: lhr.stackPacks,
            artifactsResultBaseTimestamp: requestsBaseTimestamp,
            timings,
            timelines,
            metricScores,
            userTimings,
            scripts,
            userFlow: flowResults,
          }),
        ),
      )
    } catch (e) {
      this.logger.error('Failed to upload audit result', { error: e })
      return {
        failedReason: 'Upload lighthouse result timeout',
        screencastStorageKey,
      }
    }

    try {
      traceDataStorageKey = await this.client.uploadArtifact(traceDataFile, Buffer.from(JSON.stringify(traceData)))
    } catch (e) {
      this.logger.error('Failed to upload trace data', { error: e })
      return {
        failedReason: 'Upload trace data failed',
        screencastStorageKey,
      }
    }

    try {
      requestsStorageKey = await this.client.uploadArtifact(requestsFile, Buffer.from(JSON.stringify(requests)))
    } catch (e) {
      this.logger.error('Failed to upload trace data', { error: e })
      return {
        failedReason: 'Upload trace data failed',
        screencastStorageKey,
      }
    }

    try {
      jsCoverageStorageKey = await this.client.uploadArtifact(jsCoverageFile, Buffer.from(JSON.stringify(jsCoverage)))
    } catch (e) {
      this.logger.error('Failed to upload audit result', { error: e })
      return {
        failedReason: 'Upload js using result timeout',
        screencastStorageKey,
      }
    }

    if (reactProfile?.dataForRoots?.length) {
      try {
        reactProfileStorageKey = await this.client.uploadArtifact(
          reactProfileFile,
          Buffer.from(JSON.stringify(reactProfile)),
        )
      } catch (e) {
        this.logger.error('Failed to upload react profile', { error: e })
      }
    } else if (this.reactProfiling && ReactProfiler.reactDetected()) {
      this.logger.error('Cannot get react profiling data.')
    }

    const traceEventsStorageKey = await this.uploadTraceEvents(artifacts)

    return {
      lighthouseStorageKey,
      screencastStorageKey,
      jsCoverageStorageKey,
      traceEventsStorageKey,
      reactProfileStorageKey,
      traceDataStorageKey,
      requestsStorageKey,
      metrics,
      failedReason,
    }
  }

  protected async warmupPageload() {
    if (this.payload.enableProxy) {
      this.logger.info('Found `enableProxy` flag. Starting proxy server now.')
      try {
        startProxyServer()
      } catch (e) {
        this.logger.error('Failed to start proxy server.', { error: e })
      }
    }

    const lhFlags = this.getLighthouseFlags()
    lhFlags.customFlags ||= {}
    lhFlags.customFlags!.dryRun = true

    let runData1: ReturnType<typeof this.runLh> extends Promise<infer T> ? T : never = {
      result: undefined,
      errorMessage: undefined,
    }
    if (this.payload.enableProxy || this.payload.warmup) {
      this.logger.info('Start warming up.')
      runData1 = await this.runLh(this.payload.url, lhFlags)
      this.logger.info('Warming up ended.')
      const lhResult = runData1.result

      if (lhResult && this.cpuThrottling) {
        this.benchmarkIndex = lhResult.lhr.environment.benchmarkIndex
        this.logger.info(`Get benchmark index ${this.benchmarkIndex}`)
      }
    }

    if (this.payload.enableProxy) {
      this.logger.info('Start seceond warming up.')
      // run page twice to cache api requests
      const runData2 = await this.runLh(this.payload.url, lhFlags)
      this.logger.info('Seceond warming up ended.')
      this.benchmarkIndex =
        ((runData1.result?.lhr.environment.benchmarkIndex ?? DEFAULT_BENCHMARK_INDEX) +
          (runData2.result?.lhr.environment.benchmarkIndex ?? DEFAULT_BENCHMARK_INDEX)) /
        2
      this.logger.info(`Get benchmark index ${this.benchmarkIndex}`)
    }
  }

  protected async stopProxyServer() {
    if (this.payload.enableProxy) {
      try {
        await clearProxyCache()
      } catch (e) {
        this.logger.error('Failed to clear proxy cache', { error: e })
      }
    }
  }

  protected async wrapLighthouseLogger() {
    // we may have different version of `debug` lib
    // hack in this is safer
    const { default: lighthouseLogger } = (await dynamicImport(
      'lighthouse-logger',
    )) as typeof import('lighthouse-logger')

    lighthouseLogger._logToStdErr = (title, args) => {
      if (title.endsWith('error')) {
        this.logger.error(args[0], args[1])
      } else if (title.endsWith('warn')) {
        // @ts-expect-error
        this.logger.warn(...args)
      } else if (!title.endsWith('verbose')) {
        // @ts-expect-error
        this.logger.verbose(...args)
      }
    }
  }

  protected async prepare() {
    this.logger.info('Start preparing page load environment.')

    try {
      await rm('tmp', { recursive: true, force: true })
      await mkdir(this.cacheDir, { recursive: true })
    } catch {
      //
    }
    const { headers, cookies, localStorage, reactProfiling, url, deviceId, sessionStorage } = this.payload
    const hostHeaders = transformHeadersToHostHeaders(headers)

    this.headers = hostHeaders
    this.cookies = cookies
    this.localStorageContent = localStorage
    this.sessionStorageContent = sessionStorage
    this.reactProfiling = reactProfiling

    await this.login()

    this.cpuThrottling = !!deviceId && deviceId !== 'no' && !!DEVICE_DESCRIPTORS[deviceId]

    if (reactProfiling) {
      const browser = await this.createBrowser({ enableProxy: false })
      try {
        this.logger.info('React profiler enabled.')
        await ReactProfiler.findReactDOMScriptAndGenerateProfilingBundle(url, browser, this.logger)
        if (ReactProfiler.reactDetected()) {
          this.logger.info('`react-dom` script detected')
        }
      } catch (e) {
        this.logger.error('Failed to detect `react-dom` script', { error: e })
      } finally {
        await browser.close()
      }
    }

    this.logger.verbose('Prepare ended.')
  }

  protected async login() {
    const { loginScript, url } = this.payload
    const { headers, cookies, localStorageContent, sessionStorageContent } = this
    const { host: domain, origin } = new URL(url)

    if (loginScript) {
      const onRequest = onRequestFactory(url, headers)
      const browser = await createBrowser()
      const page = await browser.newPage()
      await page.setRequestInterception(true)
      await page.setCookie(...formatCookies(cookies, domain))
      await page.evaluateOnNewDocument(
        (localStorageContent: LocalStorageType[], sessionStorageContent: SessionStorageType[]) => {
          localStorage.clear()
          sessionStorage.clear()
          localStorageContent.forEach(({ key, value }) => {
            localStorage.setItem(key, value)
          })
          sessionStorageContent.forEach(({ key, value }) => {
            sessionStorage.setItem(key, value)
          })
        },
        localStorageContent,
        sessionStorageContent,
      )
      page.on('request', onRequest)
      const wrappedPuppeteer = puppeteerNodeWrapper.wrap({} as any, {
        browser,
        page,
        ignoreEmulate: true,
        logger: this.logger,
      })
      const wrappedPage = await (await wrappedPuppeteer.launch()).newPage()
      const sandbox = createSandbox(
        {
          require: (m: string) => {
            return m === 'puppeteer' ? wrappedPuppeteer : undefined
          },
          page: wrappedPage,
          puppeteer: wrappedPuppeteer,
        },
        (method, message) => this.logger.info(`[From Login Script] ${message} - [${method}]`),
      )

      try {
        this.logger.info('Start running login script')
        await sandbox.run(loginScript)

        const pages = await browser.pages()
        for (const p of pages) {
          const client = await p.createCDPSession()
          const pageCookies = await client.send('Storage.getCookies')
          // @ts-expect-error
          this.cookies.push(...pageCookies.cookies)

          for (const frame of p.frames()) {
            if (new URL(frame.url()).origin === origin) {
              const pageLocalStorage = await frame.evaluate(() => {
                return Object.entries(window.localStorage)
              })
              this.logger.verbose('Collecting ' + pageLocalStorage.length + ' localStorage entries from page.')
              this.localStorageContent.push(
                ...pageLocalStorage
                  .map((e) => {
                    return { key: e[0], value: e[1] }
                  })
                  .filter((e): e is { key: string; value: string } => !!e),
              )
              const pageSessionStorage = await frame.evaluate(() => {
                return Object.entries(window.sessionStorage)
              })
              this.logger.verbose('Collecting ' + pageSessionStorage.length + ' sessionStorage entries from page.')
              this.sessionStorageContent.push(
                ...pageSessionStorage
                  .map((e) => {
                    return { key: e[0], value: e[1] }
                  })
                  .filter((e): e is { key: string; value: string } => !!e),
              )
              break
            }
          }
        }
      } catch (err) {
        const failedReason = 'Error from login script: ' + (err instanceof Error ? err.message : err)
        await this.recordScreenshot(wrappedPage)
        throw new Error(failedReason)
      } finally {
        await browser.close()
      }
    }
  }

  protected async createBrowser(options: BrowserOptions = {}) {
    const { cookies, localStorageContent, sessionStorageContent } = this
    const { url, deviceId, enableProxy, warmup } = this.payload
    const device = DEVICE_DESCRIPTORS[deviceId] ?? DEVICE_DESCRIPTORS['no']
    const domain = new URL(url).host

    const browser = await createBrowser({
      enableProxy,
      userDataDir: warmup ? this.cacheDir : undefined,
      ...options,
    })

    browser.on('targetcreated', (e: Target) => {
      const setup = async () => {
        const page = await e.page()
        if (!page) {
          return
        }
        await page.setCookie(...formatCookies(cookies, domain))
        await page.setViewport(device.viewport)

        await page.evaluateOnNewDocument(
          (localStorageContent: LocalStorageType[], sessionStorageContent: SessionStorageType[]) => {
            localStorage.clear()
            sessionStorage.clear()
            localStorageContent.forEach(({ key, value }) => {
              localStorage.setItem(key, value)
            })
            sessionStorageContent.forEach(({ key, value }) => {
              sessionStorage.setItem(key, value)
            })
          },
          localStorageContent,
          sessionStorageContent,
        )
      }

      setup().catch((e) => {
        this.logger.error('Failed to set cookies and viewport to page', e)
      })
    })

    return browser
  }

  protected getLighthouseFlags(): LH.Flags {
    const { cookies, headers, localStorageContent, reactProfiling, sessionStorageContent } = this
    const { url, deviceId, throttle, userAgent, warmup, lighthouseFlags: userFlags = {} } = this.payload
    const device = DEVICE_DESCRIPTORS[deviceId] ?? DEVICE_DESCRIPTORS['no']
    const cpuSlowdownMultiplier = Number(
      (this.cpuThrottling ? (device.cpuSlowdownMultiplier * this.benchmarkIndex) / DEFAULT_BENCHMARK_INDEX : 1).toFixed(
        2,
      ),
    )

    this.logger.info(`Will load page: ${url}`, {
      device,
      cookies,
      headers,
      throttle,
      localStorageContent,
      cpuSlowdownMultiplier,
      sessionStorageContent,
    })

    const downloadKbps = throttle.download ? throttle.download / 125 : 40000
    const uploadKbps = throttle.upload ? throttle.upload / 125 : 40000

    return {
      formFactor: device.formFactor,
      screenEmulation: { disabled: true, width: device.viewport.width, height: device.viewport.height },
      emulatedUserAgent: userAgent || device.userAgent,
      throttlingMethod: 'devtools',
      throttling: {
        cpuSlowdownMultiplier,
        downloadThroughputKbps: downloadKbps,
        requestLatencyMs: throttle.latency ?? 20,
        throughputKbps: downloadKbps,
        uploadThroughputKbps: uploadKbps,
        rttMs: throttle.rtt ?? 0,
      },
      ...pick(userFlags!, 'pauseAfterFcpMs', 'pauseAfterLoadMs', 'networkQuietThresholdMs', 'cpuQuietThresholdMs'),
      customFlags: {
        headers,
        reactProfiling,
        withCache: warmup,
      },
    }
  }

  protected async runLighthouse() {
    const { url, enableProxy } = this.payload
    let runs = this.payload.runs

    let result: LH.PerfseeRunnerResult | undefined
    let errorMessage: string | undefined
    let metricsList: MetricsRecord[] = []
    let errorTimes = 0

    const tmpDir = `tmp/lighthouse-artifacts-${Date.now()}`

    if (runs > 1) {
      await mkdir(tmpDir, { recursive: true })
      this.logger.verbose(`Will run ${runs} turns for more accurate result.`)
    }

    for (let i = 0; i < runs; i++) {
      this.logger.info(`Running lighthouse auditing. Round #${i + 1}`)
      const lighthouseFlags = this.getLighthouseFlags()

      try {
        const runData = await this.runLh(url, lighthouseFlags)
        const lhResult = runData.result
        if (lhResult) {
          if (runs > 1) {
            const metrics = {
              index: i,
              lcp: getLCPScore(lhResult.lhr),
              tbt: getTBTScore(lhResult.lhr),
              benchmarkIndex: lhResult.lhr.environment.benchmarkIndex,
              cpuSlowdownMultiplier: lighthouseFlags.throttling?.cpuSlowdownMultiplier,
              performance: getPerformance(lhResult.lhr),
            }
            this.logger.info('Avaliable result: ', metrics)
            metricsList.push(metrics)
            const inputFile = join(tmpDir, `${i}-artifacts.json`)
            try {
              await writeFile(inputFile, JSON.stringify(lhResult))
            } catch (e) {
              result = lhResult as LH.PerfseeRunnerResult
              this.logger.error('Failed to write input file', { error: e })
            }
          } else {
            result = lhResult as LH.PerfseeRunnerResult
          }
        }

        if (runData.errorMessage) {
          errorMessage = runData.errorMessage
        }
      } catch (e) {
        errorMessage = 'message' in (e as Error) ? (e as Error).message : String(e)
        this.logger.error(`Lab Round #${i + 1} failed`, { error: e })
        // we do not close browser because lighthouse won't
        // disconnect from CDP immediately when auditing failed.
        // If we close browser here, the whole process will stuck and won't response any more.
        // So we leave Browser closing job to process exiting.
      }

      if (enableProxy && runs >= 3 && i === runs - 1) {
        // after last run, we drop results that has a obvious variability
        const stableRuns = metricsList.filter((metric) => Math.abs(metric.benchmarkIndex - this.benchmarkIndex) <= 70)
        if (stableRuns.length) {
          metricsList = stableRuns
        } else {
          metricsList = metricsList.filter((metric) => Math.abs(metric.benchmarkIndex - this.benchmarkIndex) <= 100)
        }

        // and run more test to get enough stable results
        runs += this.payload.runs - metricsList.length
        runs = Math.min(runs, this.payload.runs * 2)
      }

      this.benchmarkIndex = getMeanValue(metricsList.map((metric) => metric.benchmarkIndex).concat(this.benchmarkIndex))

      if (errorMessage) {
        errorTimes += 1

        // save my times
        if (i === 0 || errorTimes >= 2) {
          this.logger.info('Early return because error found in first round or error occured twice.')
          break
        }
      }
    }

    await this.stopProxyServer()

    if (metricsList.length) {
      this.logger.info('All available result: ', metricsList)
      const index =
        metricsList.length < 3
          ? metricsList[metricsList.length - 1].index
          : computeMedianRun(metricsList, 'performance', 'lcp')
      const inputFile = join(tmpDir, `${index}-artifacts.json`)
      try {
        result = JSON.parse(await readFile(inputFile, { encoding: 'utf-8' })) as LH.PerfseeRunnerResult
      } catch (e) {
        this.logger.error(`Failed to read input file: ${inputFile}`, { error: e })
      } finally {
        await rm(tmpDir, { recursive: true })
      }
    }

    if (!result) {
      throw new Error(`No valid audit result for ${url}`)
    }

    return result
  }

  protected async runLh(url: string, lighthouseFlags: LH.Flags) {
    let errorMessage: string | undefined
    let result: LH.PerfseeRunnerResult | undefined
    const browser = await this.createBrowser()

    const wsEndpoint = new URL(browser.wsEndpoint())
    const lhResult = await lighthouse(url, {
      port: parseInt(wsEndpoint.port),
      hostname: wsEndpoint.hostname,
      ...lighthouseFlags,
    })

    if (lhResult) {
      const msg: LH.IcuMessage | undefined = lhResult.artifacts.PageLoadError?.friendlyMessage
      if (msg) {
        errorMessage = msg.formattedDefault
      }

      result = lhResult
    }

    try {
      await browser.close()
      this.logger.verbose('Browser closed')
    } catch (e) {
      this.logger.error('Failed to close browser', { error: e })
    }

    return {
      result,
      errorMessage,
    }
  }

  protected async recordScreenshot(page: Page) {
    const device = DEVICE_DESCRIPTORS[this.payload.deviceId] ?? DEVICE_DESCRIPTORS['no']
    try {
      const screenshot = await page.screenshot({
        encoding: 'base64',
        type: 'webp',
        quality: 10,
        clip: {
          height: device.viewport.height,
          width: device.viewport.width,
          x: 0,
          y: 0,
          scale: 0.5,
        },
      })
      this.logger.info('Screencast: ', { encoding: 'base64', type: 'webp', data: screenshot })
    } catch (e) {
      this.logger.error('Failed to take screenshot', { error: e })
    }
  }

  private async uploadScreencast(screencast: LH.ScreencastGathererResult | null) {
    try {
      const screencastFile = `screencast/${uuid()}.mp4`
      if (screencast) {
        const uploadedFileKey = await this.client.uploadArtifactFile(screencastFile, screencast.path)
        this.logger.verbose('Cleanup screencast path')
        return uploadedFileKey
      }
    } catch (e) {
      this.logger.error('Failed to upload video', { error: e })
    } finally {
      if (screencast) {
        await rm(dirname(screencast.path), { recursive: true, force: true })
      }
    }
  }

  private async uploadTraceEvents(artifacts: LH.Artifacts) {
    const { traceEvents } = artifacts.Trace

    const traceEventsFile = `trace-events/${uuid()}.json`
    try {
      return await this.client.uploadArtifact(traceEventsFile, Buffer.from(JSON.stringify(traceEvents)))
    } catch (e) {
      this.logger.error('Failed to upload trace events', { error: e })
    }
  }

  private getRequests(artifacts: LH.Artifacts, lhResult: LH.Result) {
    const networkRequestsAuditsResult =
      // @ts-expect-error
      (lhResult.audits['network-requests-custom']?.details?.items ?? []).filter(
        // requests with status code < 0 are blocked by browser
        (req: RequestSchema) => req.statusCode > 0,
      )
    const requestsBaseTimestamp = networkRequestsAuditsResult?.[0]?.baseTimestamp || artifacts.Trace.traceEvents[0].ts
    const requests = networkRequestsAuditsResult.map((item: any) => {
      delete item.baseTimestamp
      return item
    }) as RequestSchema[]
    return {
      requests,
      requestsBaseTimestamp,
    }
  }

  private getUserTimings(artifacts: LH.Artifacts, baseTimestamp: number) {
    const { traceEvents } = artifacts.Trace
    const userTimings = mapValues(
      groupBy(
        traceEvents.filter((e: any) => e.cat === 'blink.user_timing'),
        'name',
      ),
      (events) => {
        const start = events.find((e) => e.ph === 'b' || e.ph === 'B') ?? events[0]
        const end = events.find((e) => e.ph === 'e' || e.ph === 'E')

        return {
          name: start.name,
          timestamp: start.ts - baseTimestamp,
          duration: end ? end.ts - start.ts : undefined,
        }
      },
    )

    return Object.values(userTimings)
  }

  private getScripts(requests: RequestSchema[]) {
    this.logger.info('Calculate scripts hash...')

    const results = []

    try {
      for (const request of requests) {
        const [_, contentType] =
          Object.entries(request.responseHeader).find(([key]) => key.toLowerCase() === 'content-type') ?? []
        if (contentType?.toString().toLowerCase().includes('application/javascript')) {
          const url = new URL(request.url)
          const fileName = basename(url.pathname)
          if ((url.protocol === 'https:' || url.protocol === 'http:') && fileName) {
            results.push({
              fileName,
            })
          }
        }
      }
    } catch (err) {
      this.logger.error('Failed to gather scripts', { error: err })
    }

    return results
  }

  private async computeMainThreadTask(lhResult: LH.Result, artifacts: LH.Artifacts) {
    // format execution timeline data
    const trace = artifacts.Trace
    const { tasks, timings } = await computeMainThreadTasksWithTimings(trace)
    const tti = getTTI(lhResult)
    const traceData = slimTraceData(tasks, Number.isFinite(tti) ? tti + 5000 : 1000 * 20)
    return {
      traceData,
      timings,
    }
  }

  private getMetrics(lhResult: LH.Result) {
    // format snapshot metrics
    const metrics = {} as Record<MetricKeyType, number | null>

    Object.values(MetricType).forEach((type) => {
      const audit = lhResult.audits[type]
      const value = audit?.numericValue
      metrics[type] = typeof value === 'number' ? Number(value.toFixed(3)) : null
    })

    Object.values(LighthouseScoreMetric).forEach((type) => {
      const score = lhResult.categories[type]?.score ?? 0
      metrics[type] = Math.round(score * 100)
    })

    return metrics
  }
}
