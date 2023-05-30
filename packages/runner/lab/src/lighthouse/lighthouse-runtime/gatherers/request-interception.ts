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

export class RequestInterception implements LH.PerfseeGathererInstance {
  name = 'RequestInterception' as const
  private requestHandler?: (...params: any) => any

  constructor(private readonly headersWithHost?: Record<string, Record<string, string>>) {}

  async beforePass(ctx: LH.Gatherer.PassContext) {
    const driver = ctx.driver

    const onRequest = onRequestFactory(ctx.url, this.headersWithHost, driver)

    this.requestHandler = onRequest
    driver.on('Fetch.requestPaused', onRequest)
    await driver.sendCommand('Fetch.enable', { patterns: [{ urlPattern: '*' }] })
  }

  pass() {}

  async afterPass(ctx: LH.Gatherer.PassContext) {
    await ctx.driver.sendCommand('Fetch.disable')
    ctx.driver.off('Fetch.requestPaused', this.requestHandler!)
    this.requestHandler = undefined
    return null
  }
}
