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
import { join, dirname } from 'path'

import lighthouseLogger from 'lighthouse-logger'
import { groupBy, mapValues } from 'lodash'
import puppeteer from 'puppeteer-core'
import { v4 as uuid } from 'uuid'

import { JobWorker } from '@perfsee/job-runner-shared'
import { LabJobPayload } from '@perfsee/server-common'
import { CookieType, LighthouseScoreMetric, MetricKeyType, MetricType, RequestSchema } from '@perfsee/shared'
import { computeMainThreadTasksWithTimings } from '@perfsee/tracehouse'

import {
  createBrowser,
  transformHeadersToHostHeaders,
  HostHeaders,
  DEVICE_DESCRIPTORS,
  slimTraceData,
  getLighthouseMetricScores,
} from './helpers'
import { computeMedianRun, getFCP, getNumericValue, getTTI, lighthouse, MetricsRecord } from './lighthouse-runtime'

export abstract class LighthouseJobWorker extends JobWorker<LabJobPayload> {
  protected headers!: HostHeaders
  protected cookies!: CookieType[]

  protected async before() {
    this.warmupPageLoad()
    return Promise.resolve()
  }

  protected async audit() {
    this.wrapLighthouseLogger()
    const lhResult = await this.runLighthouse()

    const { lhr, artifacts } = lhResult

    const screencastStorageKey = await this.uploadScreencast(artifacts.Screencast)

    let failedReason = artifacts.PageLoadError?.friendlyMessage?.formattedDefault

    // format request data
    const devtoolsLog = artifacts.devtoolsLogs.defaultPass
    if (!devtoolsLog && !failedReason) {
      failedReason = `No artifacts result. Please check if the url '${this.payload.url}' in this env is accessible.`
      // `devtoolsLogs.defaultPass` doesn't exist when the page is not found(404).
    }

    if (!Number.isFinite(getNumericValue(lhr, 'first-contentful-paint'))) {
      failedReason = 'No valid FCP result emitted.'
    }

    if (failedReason) {
      return {
        failedReason,
        screencastStorageKey,
      }
    }

    const userTimings = this.getUserTimings(artifacts)
    const { requests, requestsBaseTimestamp } = this.getRequests(lhr)
    const metrics = this.getMetrics(lhr)
    const { traceData, timings } = this.computeMainThreadTask(lhr, artifacts)
    // format overview render timeline data
    // @ts-expect-error
    const timelines = (lhr.audits['screenshot-thumbnails'].details?.items ?? []) as TimelineSchema[]
    const metricScores = getLighthouseMetricScores('navigation', lhr.audits, timings, timelines)

    const jsCoverage = artifacts.JsUsage ?? {}

    // artifacts
    const lighthouseFile = `perfsee/snapshots/${uuid()}.json`
    const jsCoverageFile = `perfsee/js-coverage/${uuid()}.json`

    // delete useless lighthouse data
    // @ts-expect-error
    delete lhr.timing
    // hiding lighthouse running parameters
    // @ts-expect-error
    delete lhr.configSettings

    // hiding network-requests
    // @ts-expect-error
    lhr.audits['network-requests'] = {}

    try {
      await this.client.uploadArtifact(
        lighthouseFile,
        Buffer.from(
          JSON.stringify({
            lighthouseVersion: lhr.lighthouseVersion,
            lhrAudit: lhr.audits,
            lhrCategories: lhr.categories,
            traceData,
            artifactsResult: requests,
            artifactsResultBaseTimestamp: requestsBaseTimestamp,
            timings,
            timelines,
            metricScores,
            userTimings,
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
      await this.client.uploadArtifact(jsCoverageFile, Buffer.from(JSON.stringify(jsCoverage)))
    } catch (e) {
      this.logger.error('Failed to upload audit result', { error: e })
      return {
        failedReason: 'Upload js using result timeout',
        screencastStorageKey,
      }
    }

    const traceEventsStorageKey = await this.uploadTraceEvents(artifacts)

    return {
      lighthouseStorageKey: lighthouseFile,
      screencastStorageKey,
      jsCoverageStorageKey: jsCoverageFile,
      traceEventsStorageKey,
      metrics,
    }
  }

  private wrapLighthouseLogger() {
    // we may have different version of `debug` lib
    // hack in this is safer
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

  private warmupPageLoad() {
    this.logger.info('Start warming up page load environment.')

    const { headers, cookies } = this.payload
    const hostHeaders = transformHeadersToHostHeaders(headers)

    this.headers = hostHeaders
    this.cookies = cookies

    this.logger.verbose('Warming up ended.')
  }

  private async runLighthouse() {
    const { cookies, headers } = this
    const { url, deviceId, throttle, runs } = this.payload
    const device = DEVICE_DESCRIPTORS[deviceId] ?? DEVICE_DESCRIPTORS['no']

    this.logger.info(`Will load page: ${url}`, {
      device,
      cookies,
      headers,
      throttle,
    })

    const downloadKbps = throttle.download ? throttle.download / 125 : 40000
    const uploadKbps = throttle.upload ? throttle.upload / 125 : 40000
    const lighthouseFlags: LH.Flags = {
      formFactor: device.formFactor,
      screenEmulation: { disabled: true, width: device.viewport.width, height: device.viewport.height },
      emulatedUserAgent: device.userAgent,
      throttlingMethod: 'devtools',
      throttling: {
        cpuSlowdownMultiplier: device.cpuSlowdownMultiplier,
        downloadThroughputKbps: downloadKbps,
        requestLatencyMs: throttle.latency ?? 20,
        throughputKbps: downloadKbps,
        uploadThroughputKbps: uploadKbps,
        rttMs: throttle.rtt ?? 0,
      },
      customFlags: {
        headers,
      },
    }

    let result: LH.PerfseeRunnerResult | undefined
    let errorMessage: string | undefined
    const metricsList: MetricsRecord[] = []

    const tmpDir = `tmp/lighthouse-artifacts-${Date.now()}`

    if (runs > 1) {
      await mkdir(tmpDir, { recursive: true })
      this.logger.verbose(`Will run ${runs} turns for more accurate result.`)
    }

    for (let i = 0; i < runs; i++) {
      this.logger.info(`Running lighthouse auditing. Round #${i + 1}`)
      const browser = await createBrowser()

      browser.on('targetcreated', (e: puppeteer.Target) => {
        const setup = async () => {
          const page = await e.page()
          if (!page) {
            return
          }
          await page.setCookie(...cookies)
          await page.setViewport(device.viewport)
        }

        setup().catch((e) => {
          this.logger.error('Failed to set cookies and viewport to page', e)
        })
      })

      try {
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

          if (runs > 1) {
            metricsList.push({
              index: i,
              fcp: getFCP(lhResult.lhr),
              tti: getTTI(lhResult.lhr),
            })
            const inputFile = join(tmpDir, `${i}-artifacts.json`)
            await writeFile(inputFile, JSON.stringify(lhResult))
          } else {
            result = lhResult
          }
        }

        try {
          await browser.close()
          this.logger.verbose('Browser closed')
        } catch (e) {
          this.logger.error('Failed to close browser', { error: e })
        }
      } catch (e) {
        errorMessage = 'message' in (e as Error) ? (e as Error).message : String(e)
        this.logger.error(`Lab Round #${i + 1} failed`, { error: e })
        // we do not close browser because lighthouse won't
        // disconnect from CDP immediately when auditing failed.
        // If we close browser here, the whole process will stuck and won't response any more.
        // So we leave Browser closing job to process exiting.
      }

      // save my times
      if (i === 0 && errorMessage) {
        this.logger.info('Early return because error found in first round.')
        break
      }
    }

    if (runs > 1 && metricsList.length) {
      this.logger.info('All available result: ', metricsList)
      const index = metricsList.length < 3 ? metricsList[metricsList.length - 1].index : computeMedianRun(metricsList)
      const inputFile = join(tmpDir, `${index}-artifacts.json`)
      result = JSON.parse(await readFile(inputFile, { encoding: 'utf-8' })) as LH.PerfseeRunnerResult
      await rm(tmpDir, { recursive: true })
    }

    if (!result) {
      throw new Error(`No valid audit result for ${url}`)
    }

    return result
  }

  private async uploadScreencast(screencast: LH.ScreencastGathererResult | null) {
    try {
      const screencastFile = `perfsee/screencast/${uuid()}.mp4`
      if (screencast) {
        await this.client.uploadArtifactFile(screencastFile, screencast.path)
        this.logger.verbose('Cleanup screencast path')
        await rm(dirname(screencast.path), { recursive: true, force: true })
        return screencastFile
      }
    } catch (e) {
      this.logger.error('Failed to upload video', { error: e })
    }
  }

  private async uploadTraceEvents(artifacts: LH.Artifacts) {
    const { traceEvents } = artifacts.traces['defaultPass']

    const traceEventsFile = `perfsee/trace-events/${uuid()}.json`
    try {
      await this.client.uploadArtifact(traceEventsFile, Buffer.from(JSON.stringify(traceEvents)))
      return traceEventsFile
    } catch (e) {
      this.logger.error('Failed to upload trace events', { error: e })
    }
  }

  private getRequests(lhResult: LH.Result) {
    // @ts-expect-error
    const networkRequestsAuditsResult = (lhResult.audits['network-requests']?.details?.items ?? []).filter(
      // requests with status code < 0 are blocked by browser
      (req: RequestSchema) => req.statusCode > 0,
    )
    const requestsBaseTimestamp = networkRequestsAuditsResult[0].baseTimestamp
    const requests = networkRequestsAuditsResult.map((item: any) => {
      delete item.baseTimestamp
      return item
    }) as RequestSchema[]
    return {
      requests,
      requestsBaseTimestamp,
    }
  }

  private getUserTimings(artifacts: LH.Artifacts) {
    const { traceEvents } = artifacts.traces['defaultPass']
    const baseline = traceEvents.find((e) => e.name === 'navigationStart')

    if (!baseline) return
    const userTimings = mapValues(
      groupBy(
        traceEvents.filter((e: any) => e.scope === 'blink.user_timing'),
        'name',
      ),
      (events) => {
        const start = events.find((e) => e.ph === 'b' || e.ph === 'B') ?? events[0]
        const end = events.find((e) => e.ph === 'e' || e.ph === 'E')

        return {
          name: start.name,
          timestamp: start.ts - baseline.ts,
          duration: end ? end.ts - start.ts : undefined,
        }
      },
    )

    return Object.values(userTimings)
  }

  private computeMainThreadTask(lhResult: LH.Result, artifacts: LH.Artifacts) {
    // format execution timeline data
    const trace = artifacts['traces']['defaultPass']
    const { tasks, timings } = computeMainThreadTasksWithTimings(trace)
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
