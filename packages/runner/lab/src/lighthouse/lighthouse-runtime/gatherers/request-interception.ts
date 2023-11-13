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

import { onRequestFactory } from '../../helpers'

import { GathererInstance } from './gatherer'

export class RequestInterception extends GathererInstance {
  private requestHandler?: (...params: any) => any

  constructor(private readonly headersWithHost?: Record<string, Record<string, string>>) {
    super()
  }

  async startInstrumentation(ctx: LH.Gatherer.Context) {
    const driver = ctx.driver.defaultSession

    const onRequest = onRequestFactory(ctx.page!.url(), this.headersWithHost, driver)

    this.requestHandler = onRequest
    driver.on('Fetch.requestPaused', onRequest)
    await driver.sendCommand('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
  }

  async stopInstrumentation(ctx: LH.Gatherer.Context) {
    await ctx.driver.defaultSession.sendCommand('Fetch.disable')
    ctx.driver.defaultSession.off('Fetch.requestPaused', this.requestHandler!)
    this.requestHandler = undefined
  }

  getArtifact() {
    return {}
  }
}
