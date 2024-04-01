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

import { HTTPRequest } from 'puppeteer-core'

import { frameWrapper } from './frame'
import { httpResponseWrapper } from './http-response'
import { NotSupportFunction } from './utils'
import { createWrapper, Wrapper } from './wrapper'

// https://github.com/puppeteer/puppeteer/blob/v11.0.0/docs/api.md#class-httprequest
export const httpRequestWrapper: Wrapper<HTTPRequest> = createWrapper<HTTPRequest>(
  'HTTPRequest',
  (httpRequest, options) => {
    return {
      abort: (errorCode, priority) => httpRequest.abort(errorCode, priority),
      abortErrorReason: () => httpRequest.abortErrorReason(),
      continue: (overrides, priority) => httpRequest.continue(overrides, priority),
      continueRequestOverrides: () => httpRequest.continueRequestOverrides(),
      enqueueInterceptAction: NotSupportFunction,
      failure: () => httpRequest.failure(),
      finalizeInterceptions: () => httpRequest.finalizeInterceptions(),
      frame: () => frameWrapper.wrapOrNull(httpRequest.frame(), options),
      headers: () => httpRequest.headers(),
      isNavigationRequest: () => httpRequest.isNavigationRequest(),
      method: () => httpRequest.method(),
      postData: () => httpRequest.postData(),
      redirectChain: () => httpRequest.redirectChain().map((r) => httpRequestWrapper.wrap(r, options)),
      resourceType: () => httpRequest.resourceType(),
      respond: (response, priority) => httpRequest.respond(response, priority),
      response: () => httpResponseWrapper.wrapOrNull(httpRequest.response(), options),
      responseForRequest: NotSupportFunction, // typescript type is inconsistent with the documentation?
      url: () => httpRequest.url(),
      interceptResolutionState: NotSupportFunction,
      isInterceptResolutionHandled: () => httpRequest.isInterceptResolutionHandled(),
      initiator: () => httpRequest.initiator(),
      client: httpRequest.client,
      hasPostData: () => httpRequest.hasPostData(),
      fetchPostData: () => httpRequest.fetchPostData(),
    }
  },
)
