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

import { JobWorker } from '@perfsee/job-runner-shared'
import { PingJobPayload } from '@perfsee/server-common'
import { CookieType, HeaderHostType } from '@perfsee/shared'

import { createBrowser, HostHeaders, transformHeadersToHostHeaders, DEVICE_DESCRIPTORS, formatCookies } from './helpers'

export abstract class LabPingJobWorker extends JobWorker<PingJobPayload> {
  protected headers!: HostHeaders
  protected cookies!: CookieType[]

  protected async before() {
    this.warmupPageLoad()
    return Promise.resolve()
  }

  protected async audit(): Promise<{ status: 'success' | 'failed' }> {
    const { deviceId, url } = this.payload

    const device = DEVICE_DESCRIPTORS[deviceId] ?? DEVICE_DESCRIPTORS['no']
    const domain = new URL(url).host

    const browser = await createBrowser({ defaultViewport: device.viewport })
    const page = await browser.newPage()
    await page.setCookie(...formatCookies(this.cookies, domain))

    const host = new URL(url).host
    const headers = {
      ...this.headers[host],
      ...this.headers[HeaderHostType.All],
      ...this.headers[HeaderHostType.Self],
    }

    await page.setExtraHTTPHeaders(headers)

    this.logger.info(`Will load page: ${url}`, {
      device,
      cookies: this.cookies,
      headers: this.headers,
    })

    const result = await page.goto(url)
    const success = result?.status() === 200

    try {
      await browser.close()
      this.logger.info('browser closed')
    } catch (err) {
      this.logger.error('Failed to close browser', { error: err })
    }

    if (success) {
      return {
        status: 'success',
      }
    }

    return {
      status: 'failed',
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
}
