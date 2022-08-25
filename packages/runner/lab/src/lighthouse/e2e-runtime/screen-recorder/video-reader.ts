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

import EventEmitter from 'events'

import { CDPSession, Page } from 'puppeteer-core'

export default class VideoReader extends EventEmitter {
  private isStarted = false

  private session: CDPSession = null!
  private isEndFrameReceived: Promise<void> = null!

  constructor(private readonly page: Page) {
    super()
  }

  async start() {
    if (this.isStarted) {
      throw new Error('VideoReader already started')
    }
    this.isStarted = true

    const session = await this.getPageSession(this.page)
    this.page.once('close', this.handlePageClose)
    this.createScreenCastFrameHandler(session)

    this.session = session

    await session.send('Page.startScreencast', {
      everyNthFrame: 1,
    })
  }

  async stop() {
    if (!this.isStarted) {
      return
    }

    this.isStarted = false

    this.page.off('close', this.handlePageClose)

    await Promise.race([this.isEndFrameReceived, new Promise((resolve) => setTimeout(resolve, 1000))])

    try {
      await this.session.detach()
    } catch (e) {
      console.warn('Error detaching session', e)
    }
  }

  private readonly handlePageClose = () => {
    this.stop().catch((err) => console.error('failed stop video reader', err))
  }

  private createScreenCastFrameHandler(session: CDPSession) {
    this.isEndFrameReceived = new Promise((resolve) => {
      session.on('Page.screencastFrame', ({ metadata, data, sessionId }: any) => {
        if (!metadata.timestamp) {
          return resolve()
        }

        session
          .send('Page.screencastFrameAck', {
            sessionId: sessionId,
          })
          .catch((err) => console.error('failed to ack screencast frame', err))

        this.emit('frame', {
          blob: Buffer.from(data, 'base64'),
          timestamp: metadata.timestamp,
        })
      })
    })
  }

  private async getPageSession(page: Page): Promise<CDPSession> {
    const context = page.target()
    return context.createCDPSession()
  }
}
