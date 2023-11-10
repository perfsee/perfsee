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

import Gatherer from 'lighthouse/types/gatherer'
import { truncate } from 'lodash'
import { Protocol } from 'puppeteer-core'

import { logger } from '@perfsee/job-runner-shared'

import { GathererInstance } from './gatherer'

export class ConsoleLogger extends GathererInstance {
  private messageHandler?: (...params: any) => any

  async startInstrumentation(ctx: Gatherer.Context) {
    const driver = ctx.driver.defaultSession

    const onMessage = (event: Protocol.Log.EntryAddedEvent) => {
      logger.verbose(
        `From page [${event.entry.source}:${event.entry.level}:${event.entry.url ?? ''}:${
          event.entry.lineNumber ?? ''
        }]: ${truncate(event.entry.text, { length: 200 })}`,
      )
    }

    this.messageHandler = onMessage

    driver.on('Log.entryAdded', onMessage)
    await driver.sendCommand('Log.enable')
  }

  async stopInstrumentation(ctx: Gatherer.Context) {
    await ctx.driver.defaultSession.sendCommand('Log.disable')
    ctx.driver.defaultSession.off('Log.entryAdded', this.messageHandler!)
    this.messageHandler = undefined
  }

  getArtifact() {
    return {}
  }
}
