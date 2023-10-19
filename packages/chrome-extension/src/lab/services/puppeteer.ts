// Copyright (c) 2022 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import * as puppeteer from '../../puppeteer'

import { ParallelConnectionInterface } from './connection'

class Transport implements puppeteer.ConnectionTransport {
  #connection: ParallelConnectionInterface

  constructor(connection: ParallelConnectionInterface) {
    this.#connection = connection
  }

  send(data: string): void {
    console.log('Transport Send Raw Message', data)
    this.#connection.sendRawMessage(data)
  }

  close(): void {
    void this.#connection.disconnect()
  }

  set onmessage(cb: (message: string) => void) {
    this.#connection.setOnMessage((message: any) => {
      const data = message as { id: number; method: string; params: unknown; sessionId?: string }
      // if (!data.sessionId) {
      //   return
      // }
      console.log('transport on message', data)

      return cb(
        JSON.stringify({
          ...data,
          // Puppeteer is expecting to use the default session, but we give it a non-default session in #connection.
          // Replace that sessionId with undefined so Puppeteer treats it as default.
          sessionId: data.sessionId === this.#connection.getSessionId() ? undefined : data.sessionId,
        }),
      )
    })
  }

  set onclose(cb: () => void) {
    const prev = this.#connection.getOnDisconnect()
    this.#connection.setOnDisconnect((reason: any) => {
      if (prev) {
        prev(reason)
      }
      if (cb) {
        cb()
      }
    })
  }
}

self.__PUPPETEER_DEBUG = '*'

class PuppeteerConnection extends puppeteer.Connection {
  override async onMessage(message: string): Promise<void> {
    const msgObj = JSON.parse(message) as { id: number; method: string; params: unknown; sessionId?: string }

    void super.onMessage(message)
  }
}

export class PuppeteerConnectionHelper {
  static async connectPuppeteerToConnectionViaTab(options: {
    connection: ParallelConnectionInterface
    rootTargetId: string
    url: string
    mainSessionId: string
    isPageTargetCallback: (targetInfo: puppeteer.Protocol.Target.TargetInfo) => boolean
  }): Promise<{
    page: puppeteer.Page | null
    puppeteerConnection: puppeteer.Connection
  }> {
    const { connection, isPageTargetCallback, rootTargetId, mainSessionId, url } = options
    // Pass an empty message handler because it will be overwritten by puppeteer anyways.
    const transport = new Transport(connection)

    // url is an empty string in this case parallel to:
    // https://github.com/puppeteer/puppeteer/blob/f63a123ecef86693e6457b07437a96f108f3e3c5/src/common/BrowserConnector.ts#L72
    const puppeteerConnection = new PuppeteerConnection('', transport)
    puppeteerConnection.onMessage(
      JSON.stringify({
        method: 'Target.attachedToTarget',
        params: {
          targetInfo: {
            type: 'page',
          },
          sessionId: '1',
        },
      }),
    )
    const cdpSession = puppeteerConnection._sessions.get('1')
    // const cdpSession = new puppeteer.CDPSession(puppeteerConnection, 'page', mainSessionId, undefined)
    const cdpTarget = {
      browser() {
        return null
      },
      browserContext() {
        return null
      },
      createCDPSession() {
        return cdpSession
      },
      opener() {
        return null
      },
      page() {
        return null
      },
      type() {
        return 'page'
      },
      url() {
        return url
      },
      worker() {
        return null
      },
      _targetManager() {
        return {
          on() {},
          off() {},
        }
      },
      _isClosedDeferred: {
        valueOrThrow() {
          return Promise.resolve()
        },
      },
    }
    cdpSession._setTarget(cdpTarget as any)
    try {
      const page = new puppeteer.Page(cdpSession, cdpTarget as any, true)
      return { page: page as puppeteer.Page, puppeteerConnection }
    } catch (e) {
      console.error('create page failed', e)
    }
  }
}
