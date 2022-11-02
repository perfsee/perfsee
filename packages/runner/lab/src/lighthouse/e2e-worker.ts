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

import { createRunner } from '@puppeteer/replay'
// @ts-expect-error
import defaultConfig from 'lighthouse/lighthouse-core/fraggle-rock/config/default-config'
import { v4 as uuid } from 'uuid'

import { JobWorker } from '@perfsee/job-runner-shared'
import { E2EJobPayload } from '@perfsee/server-common'
import { CookieType, LighthouseScoreMetric, MetricKeyType, MetricType, RequestSchema } from '@perfsee/shared'
import { computeMainThreadTasksWithTimings } from '@perfsee/tracehouse'

import { LighthouseRunnerExtension } from './e2e-runtime/runner-extension'
import { ScreenRecorder } from './e2e-runtime/screen-recorder'
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
} from './helpers'
import './helpers/puppeteer-patch'

export abstract class E2eJobWorker extends JobWorker<E2EJobPayload> {
  protected headers!: HostHeaders
  protected cookies!: CookieType[]

  protected async before() {
    this.warmupPageLoad()
    return Promise.resolve()
  }

  protected async audit() {
    const { deviceId, throttle, url } = this.payload

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
    await page.setCookie(...this.cookies)

    screenRecorder.record(page)

    const runnerExtension = new LighthouseRunnerExtension(
      browser,
      page,
      { timeout: 1000 * 60 * 5 },
      {
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
      },
    )

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

    // run
    let failedReason
    const screencastName = `screencast/${uuid()}.mp4`
    let screencastStorageKey
    let userFlowResult
    let userFlowArtifacts: LH.UserFlow.FlowArtifacts | undefined
    const startTime = Date.now()
    try {
      this.logger.info('Start run E2E script')
      const runner = await createRunner(
        {
          title: 'Recording 11/2/2022 at 3:33:20 PM',
          steps: [
            {
              type: 'setViewport',
              width: 1892,
              height: 781,
              deviceScaleFactor: 1,
              isMobile: false,
              hasTouch: false,
              isLandscape: false,
            },
            {
              type: 'navigate',
              url: 'https://wiki.biligame.com/ys/%E5%8E%9F%E7%A5%9E%E5%9C%B0%E5%9B%BE%E5%B7%A5%E5%85%B7_%E5%85%A8%E5%9C%B0%E6%A0%87%E4%BD%8D%E7%BD%AE%E7%82%B9',
              assertedEvents: [
                {
                  type: 'navigation',
                  url: 'https://wiki.biligame.com/ys/%E5%8E%9F%E7%A5%9E%E5%9C%B0%E5%9B%BE%E5%B7%A5%E5%85%B7_%E5%85%A8%E5%9C%B0%E6%A0%87%E4%BD%8D%E7%BD%AE%E7%82%B9',
                  title: '原神地图工具_全地标位置点',
                },
              ],
            },
            {
              type: 'click',
              target: 'main',
              selectors: [
                ['#map-menu > div.mapMenu > div.menu-search-box > input'],
                ['xpath///*[@id="map-menu"]/div[3]/div[2]/input'],
              ],
              offsetY: 16.2734375,
              offsetX: 52,
            },
            {
              type: 'change',
              value: '普通的宝箱',
              selectors: [
                ['#map-menu > div.mapMenu > div.menu-search-box > input'],
                ['xpath///*[@id="map-menu"]/div[3]/div[2]/input'],
              ],
              target: 'main',
            },
            {
              type: 'click',
              target: 'main',
              frame: [],
              selectors: [
                ['#menuList > div:nth-child(7) > div.order-h5 > span'],
                ['xpath///*[@id="menuList"]/div[7]/div[1]/span'],
              ],
              offsetX: 20,
              offsetY: 10,
            },
            {
              type: 'click',
              target: 'main',
              selectors: [
                ['#menuList > div:nth-child(7) > div.items-wrap > div:nth-child(4) > span.catTit > span'],
                ['xpath///*[@id="menuList"]/div[7]/div[2]/div[4]/span[1]/span'],
              ],
              offsetX: 22.6640625,
              offsetY: 12.5546875,
            },
            {
              type: 'click',
              selectors: [
                ['aria/放大'],
                [
                  '#map3 > div.leaflet-control-container > div.leaflet-bottom.leaflet-right > div.leaflet-control-zoom.leaflet-bar.leaflet-control > a.leaflet-control-zoom-in',
                ],
                ['xpath///*[@id="map3"]/div[2]/div[4]/div[1]/a[1]'],
              ],
              offsetX: 0,
              offsetY: 0,
              frame: [],
              target: 'main',
            },
          ],
          timeout: 10000,
        } as any,
        runnerExtension,
      )

      await runner.run()
    } catch (err) {
      failedReason = 'E2E script Error: ' + (err instanceof Error ? err.stack : err)
      this.logger.error('E2E script ' + failedReason)
    }
    const finishTime = Date.now()

    this.logger.info('E2E Script finished')

    try {
      userFlowResult = await runnerExtension.createFlowResult()
      userFlowArtifacts = runnerExtension.createArtifactsJson()
    } catch (err) {
      this.logger.error('Failed to create flow result', { error: err })
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

    if (!userFlowResult || !userFlowArtifacts) {
      return {
        failedReason: 'no user flow data',
        screencastStorageKey,
      }
    }

    const metrics = this.averageMetrics(
      userFlowResult.steps.map(({ lhr }) => {
        return this.getMetrics(lhr)
      }),
    )
    userFlowResult = userFlowResult.steps.map(({ lhr, name }, i) => {
      const artifacts = userFlowArtifacts!.gatherSteps[i].artifacts
      // format overview render timeline data
      // @ts-expect-error
      const timelines = (lhr.audits['screenshot-thumbnails'].details?.items ?? []) as TimelineSchema[]

      const timings = lhr.gatherMode === 'navigation' ? this.computeMainThreadTask(artifacts).timings : undefined
      const metricScores = getLighthouseMetricScores(lhr.gatherMode, lhr.audits, timings, timelines)

      // hiding network-requests
      // @ts-expect-error
      lhr.audits['network-requests'] = {}

      return {
        stepName: name,
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
