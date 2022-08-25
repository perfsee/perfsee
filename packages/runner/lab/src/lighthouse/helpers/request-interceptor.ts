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

import { ContinueRequestOverrides, ResponseForRequest, HTTPRequest } from 'puppeteer-core'

import { logger } from '@perfsee/job-runner-shared'
import { HeaderHostType } from '@perfsee/shared'

import { Driver } from './driver'

interface HeaderEntry {
  name: string
  value: string
}

type RequestMeta = LH.CrdpEvents['Fetch.requestPaused'][0]

function headersArray(headers: Record<string, unknown>): Array<HeaderEntry> {
  return Object.entries(headers).map(([name, value]) => ({ name, value: `${value}` }))
}

class CDPRequest {
  constructor(private readonly rawRequest: RequestMeta, private readonly driver: Driver) {}

  continue(data?: ContinueRequestOverrides) {
    return this.driver.sendCommand('Fetch.continueRequest', {
      ...data,
      requestId: this.rawRequest.requestId,
      headers: Object.entries(data?.headers ?? {}).map(([name, value]) => ({ name, value })),
    })
  }

  respond(data: ResponseForRequest) {
    const body =
      typeof data.body === 'string' ? Buffer.from(data.body).toString('base64') : data.body.toString('base64')

    return this.driver.sendCommand('Fetch.fulfillRequest', {
      requestId: this.rawRequest.requestId,
      responseCode: data.status,
      responseHeaders: data.headers ? headersArray(data.headers) : undefined,
      body,
    })
  }

  abort(errorReason: LH.Crdp.Network.ErrorReason) {
    return this.driver.sendCommand('Fetch.failRequest', {
      requestId: this.rawRequest.requestId,
      errorReason,
    })
  }
}

export function onRequestFactory(
  pageUrl: string,
  extraHeadersWithHost?: Record<string, Record<string, string>>,
  driver?: Driver,
) {
  return (raw: RequestMeta | HTTPRequest) => {
    let request: CDPRequest | HTTPRequest | null = null
    let rawHeaders: Record<string, string> = {}
    let requestUrl = ''
    // puppeteer
    if ('url' in raw) {
      if (typeof raw.url === 'function') {
        request = raw
        rawHeaders = raw.headers()
        requestUrl = raw.url()
      }
    } else if (driver) {
      // cdp request
      request = new CDPRequest(raw, driver)
      rawHeaders = raw.request.headers
      requestUrl = raw.request.url
    }

    if (!request || !requestUrl) {
      return
    }

    const host = new URL(requestUrl).host

    const headers = {
      ...rawHeaders,
      ...extraHeadersWithHost?.[host],
      ...extraHeadersWithHost?.[HeaderHostType.All],
      ...(pageUrl === requestUrl ? extraHeadersWithHost?.[HeaderHostType.Self] : {}),
    }

    request.continue({ headers }).catch((e: any) => {
      logger.error(e)
    })
  }
}
