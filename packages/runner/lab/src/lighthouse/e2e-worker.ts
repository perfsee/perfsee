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

import { promises as fs } from 'fs'
import { dirname, join } from 'path'

// @ts-expect-error
import defaultConfig from 'lighthouse/lighthouse-core/fraggle-rock/config/default-config'
import { v4 as uuid } from 'uuid'

import { JobWorker } from '@perfsee/job-runner-shared'
import { E2EJobPayload } from '@perfsee/server-common'
import { CookieType, LighthouseScoreMetric, MetricKeyType, MetricType, RequestSchema } from '@perfsee/shared'
import { computeMainThreadTasksWithTimings } from '@perfsee/tracehouse'

import { createSandbox } from './e2e-runtime/sandbox'
import { ScreenRecorder } from './e2e-runtime/screen-recorder'
import { LighthouseFlow } from './e2e-runtime/wrapper/flow'
import { puppeteerNodeWrapper } from './e2e-runtime/wrapper/puppeteer'
import {
  createBrowser,
  HostHeaders,
  transformHeadersToHostHeaders,
  onRequestFactory,
  DEVICE_DESCRIPTORS,
  slimTraceData,
  getLighthouseMetricScores,
  Driver,
  getNetworkRecords,
  NetworkRecord,
  formatCookies,
} from './helpers'

export abstract class E2eJobWorker extends JobWorker<E2EJobPayload> {
  protected headers!: HostHeaders
  protected cookies!: CookieType[]

  protected async before() {
    this.warmupPageLoad()
    return Promise.resolve()
  }

  protected async audit() {
    const { deviceId, throttle, url } = this.payload
    const domain = new URL(url).host

    const device = DEVICE_DESCRIPTORS[deviceId] ?? DEVICE_DESCRIPTORS['no']

    const dir = `tmp/e2e-screencast-${Date.now()}`
    await fs.mkdir(dir, { recursive: true })
    const videoFile = join(dir, 'screencast.mp4')

    const screenRecorder = new ScreenRecorder(videoFile, {
      videoFrame: {
        width: Math.floor(device.viewport.width / 2),
        height: Math.floor(device.viewport.height / 2),
      },
    })

    const browser = await createBrowser({ defaultViewport: device.viewport, headless: true })

    const page = await browser.newPage()
    await page.setCookie(...formatCookies(this.cookies, domain))

    screenRecorder.record(page)

    const flow = new LighthouseFlow(page, {
      name: 'e2e flow',
      config: {
        ...defaultConfig,
        settings: {
          ...defaultConfig.settings,
          screenEmulation: { disabled: true, width: device.viewport.width, height: device.viewport.height },
          emulatedUserAgent: device.userAgent,
          throttling: {
            cpuSlowdownMultiplier: device.cpuSlowdownMultiplier,
            downloadThroughputKbps: throttle.download ? throttle.download / 125 : 40000,
            uploadThroughputKbps: throttle.upload ? throttle.upload / 125 : 40000,
            requestLatencyMs: throttle.latency ?? 20,
            throughputKbps: throttle.download ? throttle.download / 125 : 40000,
            rttMs: throttle.rtt ?? 0,
          },
        },
      },
    })

    // --- collect network requests ---
    const client = await page.target().createCDPSession()
    const networkLogs: LH.DevtoolsLog = []
    await client.send('Network.enable')
    // listen to network events
    client.on('*', ((type: string, e: any) => {
      if (typeof type === 'string' && type.startsWith('Network.')) {
        networkLogs.push({
          method: type as any,
          params: e ?? [],
          sessionId: '',
        })
      }
    }) as any)

    // --- setup request handler ---
    const drive: Driver = {
      on: client.on.bind(client) as any,
      once: client.once.bind(client) as any,
      off: client.off.bind(client) as any,
      sendCommand: client.send.bind(client),
      evaluate: () => {
        throw new Error('not support')
      },
      evaluateAsync: () => {
        throw new Error('not support')
      },
    }
    const requestHandler = onRequestFactory(url, this.headers, drive)
    client.on('Fetch.requestPaused', requestHandler)
    await client.send('Fetch.enable', { patterns: [{ urlPattern: '*' }] })

    const wrappedPuppeteer = puppeteerNodeWrapper.wrap({} as any, {
      page,
      browser,
      flow,
      ignoreEmulate: true,
    })

    const wrappedPage = await (await wrappedPuppeteer.launch()).newPage()

    // create sandbox
    const sandbox = createSandbox(
      {
        require: (m: string) => {
          return m === 'puppeteer' ? wrappedPuppeteer : undefined
        },
        page: wrappedPage,
        flow: {
          startStep: (name: string) => {
            if (typeof name !== 'string' || name.trim() === '') {
              throw new Error(`Invalid step name: ${name}`)
            }
            return flow.startStep(name)
          },
          endStep: () => {
            return flow.endStep()
          },
        },
      },
      (method, message) => this.logger.info(`[From E2E Script] ${message} - [${method}]`),
    )

    // run
    let failedReason
    const screencastName = `screencast/${uuid()}.mp4`
    let screencastStorageKey
    let userFlowResult
    const startTime = Date.now()
    try {
      this.logger.info('Start run E2E script')
      await sandbox.run(this.payload.e2eScript!)
    } catch (err) {
      failedReason = 'JavaScript Error: ' + (err instanceof Error ? err.message : err)
      this.logger.error('E2E script ' + failedReason)
    }
    const finishTime = Date.now()

    this.logger.info('E2E Script finished')

    try {
      userFlowResult = await flow.endFlow()
    } catch (err) {
      this.logger.error('Failed to end flow', { error: err })
    }

    if (screenRecorder.isStarted) {
      await screenRecorder.stop()
      screencastStorageKey = await this.uploadScreencast(screencastName, videoFile)
    }

    try {
      await browser.close()
      this.logger.info('browser closed')
    } catch (err) {
      this.logger.error('Failed to close browser', { error: err })
    }

    const { requests, requestsBaseTimestamp } = this.getRequests(getNetworkRecords(networkLogs))

    if (failedReason) {
      return {
        failedReason,
        screencastStorageKey,
      }
    }

    if (!userFlowResult) {
      return {
        failedReason: 'no user flow data',
        screencastStorageKey,
      }
    }

    const metrics = this.averageMetrics(
      userFlowResult.map(({ lhr }) => {
        return this.getMetrics(lhr)
      }),
    )
    userFlowResult = userFlowResult.map(({ lhr, artifacts, stepName }) => {
      // format overview render timeline data
      // @ts-expect-error
      const timelines = (lhr.audits['screenshot-thumbnails'].details?.items ?? []) as TimelineSchema[]

      const timings = lhr.gatherMode === 'navigation' ? this.computeMainThreadTask(artifacts).timings : undefined
      const metricScores = getLighthouseMetricScores(lhr.gatherMode, lhr.audits, timings, timelines)

      // hiding network-requests
      // @ts-expect-error
      lhr.audits['network-requests'] = {}

      return {
        stepName,
        stepUrl: lhr.requestedUrl,
        stepMode: lhr.gatherMode,
        lhrAudit: lhr.audits,
        lhrCategories: lhr.categories,
        timings,
        timelines,
        metricScores,
      }
    })

    const metricScores = [
      {
        id: 'duration',
        title: 'Duration',
        value: finishTime - startTime,
        formatter: 'duration',
      },
      {
        id: 'step-count',
        title: 'Step Count',
        value: userFlowResult.length,
        formatter: 'unitless',
      },
    ]

    try {
      const lighthouseStorageName = `snapshots/${uuid()}.json`
      const lighthouseStorageKey = await this.client.uploadArtifact(
        lighthouseStorageName,
        Buffer.from(
          JSON.stringify({
            metricScores,
            userFlow: userFlowResult,
            artifactsResult: requests,
            artifactsResultBaseTimestamp: requestsBaseTimestamp,
          }),
        ),
      )

      return {
        screencastStorageKey,
        lighthouseStorageKey,
        metrics,
      }
    } catch (e) {
      this.logger.error('Failed to upload lighthouse result', { error: e })
      return {
        failedReason: 'Upload lighthouse result timeout',
        screencastStorageKey,
      }
    }
  }

  private warmupPageLoad() {
    this.logger.info('Start warming up page load environment.')

    const { headers, cookies } = this.payload
    const hostHeaders = transformHeadersToHostHeaders(headers)
    this.headers = hostHeaders
    this.cookies = cookies

    this.logger.verbose('Warming up ended.')
  }

  private async uploadScreencast(name: string, screencastPath: string) {
    try {
      const fileKey = await this.client.uploadArtifactFile(name, screencastPath)
      this.logger.verbose('Cleanup screencast path')
      await fs.rm(dirname(screencastPath), { recursive: true, force: true })
      return fileKey
    } catch (e) {
      this.logger.error('Failed to upload video', { error: e })
    }
  }

  private computeMainThreadTask(artifacts: LH.Artifacts) {
    // format execution timeline data
    const trace = artifacts['traces']['defaultPass']
    const { tasks, timings } = computeMainThreadTasksWithTimings(trace)
    const traceData = slimTraceData(tasks, Infinity)
    return {
      traceData,
      timings,
    }
  }

  private getRequests(networkRecords: NetworkRecord[]) {
    const requestsBaseTimestamp = networkRecords.length > 0 ? networkRecords[0].baseTimestamp : 0
    const requests = networkRecords.map((item: any) => {
      delete item.baseTimestamp
      return item
    }) as RequestSchema[]
    return {
      requests,
      requestsBaseTimestamp,
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
      const score = lhResult.categories[type]?.score
      metrics[type] = typeof score === 'number' ? Math.round(score * 100) : null
    })

    return metrics
  }

  private averageMetrics(metrics: Record<MetricKeyType, number | null>[]) {
    const averageMetrics = {} as Record<MetricKeyType, number | null>

    Object.values(MetricType).forEach((type) => {
      const values = metrics.map((item) => item[type]).filter((item): item is number => item !== null)
      const average = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
      averageMetrics[type] = average
    })

    Object.values(LighthouseScoreMetric).forEach((type) => {
      const values = metrics.map((item) => item[type]).filter((item): item is number => item !== null)
      const average = values.length > 0 ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
      averageMetrics[type] = average
    })

    return averageMetrics
  }
}
