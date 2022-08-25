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

import { HTTPResponse } from 'puppeteer-core'

import { frameWrapper } from './frame'
import { httpRequestWrapper } from './http-request'
import { securityDetailsWrapper } from './security-details'
import { createWrapper, Wrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-httpresponse
export const httpResponseWrapper: Wrapper<HTTPResponse> = createWrapper<HTTPResponse>(
  'HTTPResponse',
  (httpResponse, options) => {
    return {
      buffer: () => httpResponse.buffer(),
      frame: () => frameWrapper.wrapOrNull(httpResponse.frame(), options),
      fromCache: () => httpResponse.fromCache(),
      fromServiceWorker: () => httpResponse.fromServiceWorker(),
      headers: () => httpResponse.headers(),
      json: () => httpResponse.json(),
      ok: () => httpResponse.ok(),
      remoteAddress: () => httpResponse.remoteAddress(),
      request: () => httpRequestWrapper.wrap(httpResponse.request(), options),
      securityDetails: () => securityDetailsWrapper.wrapOrNull(httpResponse.securityDetails(), options),
      status: () => httpResponse.status(),
      statusText: () => httpResponse.statusText(),
      text: () => httpResponse.text(),
      url: () => httpResponse.url(),
      timing: () => httpResponse.timing(),
    }
  },
)
