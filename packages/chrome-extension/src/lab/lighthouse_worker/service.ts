// Copyright (c) 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { ParallelConnectionInterface } from '../services/connection.js'
import { PuppeteerConnectionHelper } from '../services/puppeteer.js'

/**
 * ConnectionProxy is a SDK interface, but the implementation has no knowledge it's a parallelConnection.
 * The CDP traffic is smuggled back and forth by the system described in LighthouseProtocolService
 */
class ConnectionProxy implements ParallelConnectionInterface {
  sessionId: string
  onMessage: ((arg0: any) => void) | null
  onDisconnect: ((arg0: string) => void) | null

  constructor(sessionId: string) {
    this.sessionId = sessionId
    this.onMessage = null
    this.onDisconnect = null
  }

  setOnMessage(onMessage: (arg0: any | string) => void): void {
    this.onMessage = onMessage
  }

  setOnDisconnect(onDisconnect: (arg0: string) => void): void {
    this.onDisconnect = onDisconnect
  }

  getOnDisconnect(): ((arg0: string) => void) | null {
    return this.onDisconnect
  }

  getSessionId(): string {
    return this.sessionId
  }

  sendRawMessage(message: string): void {
    notifyFrontendViaWorkerMessage('sendProtocolMessage', { message })
  }

  async disconnect(): Promise<void> {
    this.onDisconnect?.('force disconnect')
    this.onDisconnect = null
    this.onMessage = null
    return Promise.resolve()
  }
}

let cdpConnection: ConnectionProxy | undefined
let endTimespan: (() => unknown) | undefined

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function invokeLH(action: string, args: any): Promise<unknown> {
  // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
  self.listenForStatus((message) => {
    notifyFrontendViaWorkerMessage('statusUpdate', { message: message[1] })
  })

  let puppeteerHandle:
    | Awaited<ReturnType<typeof PuppeteerConnectionHelper['connectPuppeteerToConnectionViaTab']>>
    | undefined

  try {
    // For timespan we only need to perform setup on startTimespan.
    // Config, flags, locale, etc. should be stored in the closure of endTimespan.
    if (action === 'endTimespan') {
      if (!endTimespan) {
        throw new Error('Cannot end a timespan before starting one')
      }
      const result = await endTimespan()
      endTimespan = undefined
      return result
    }

    const flags = args.flags
    flags.logLevel = flags.logLevel || 'info'
    flags.channel = 'devtools'

    // TODO: Remove this filter once pubads is mode restricted
    // https://github.com/googleads/publisher-ads-lighthouse-plugin/pull/339
    if (action === 'startTimespan' || action === 'snapshot') {
      args.categoryIDs = args.categoryIDs.filter((c: string) => c !== 'lighthouse-plugin-publisher-ads')
    }

    // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
    const config = args.config || self.createConfig(args.categoryIDs, flags.formFactor)
    const url = args.url

    const { mainSessionId, rootTargetId } = args
    cdpConnection = new ConnectionProxy(mainSessionId)
    puppeteerHandle = await PuppeteerConnectionHelper.connectPuppeteerToConnectionViaTab({
      connection: cdpConnection,
      mainSessionId,
      url,
      rootTargetId,
      // Lighthouse can only audit normal pages.
      isPageTargetCallback: (targetInfo) => targetInfo.type === 'page',
    })

    const { page } = puppeteerHandle
    if (!page) {
      throw new Error('Could not create page handle for the target page')
    }

    console.log('action', action, url)
    // if (action === 'snapshot') {
    //   // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
    //   return self.snapshot(page, { config, flags })
    // }

    // if (action === 'startTimespan') {
    //   // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
    //   const timespan = await self.startTimespan(page, { config, flags })
    //   endTimespan = timespan.endTimespan
    //   return
    // }
    // @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
    return self.navigation(page, url, { config, flags })
  } catch (err: any) {
    return {
      fatal: true,
      message: err.message,
      stack: err.stack,
    }
  } finally {
    // endTimespan will need to use the same connection as startTimespan.
    if (action !== 'startTimespan') {
      puppeteerHandle?.browser.disconnect()
    }
  }
}

/**
 * `notifyFrontendViaWorkerMessage` and `onFrontendMessage` work with the FE's ProtocolService.
 *
 * onFrontendMessage takes action-wrapped messages and either invoking lighthouse or delivering it CDP traffic.
 * notifyFrontendViaWorkerMessage posts action-wrapped messages to the FE.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function notifyFrontendViaWorkerMessage(action: string, args: any): void {
  self.postMessage({ action, args })
}

async function onFrontendMessage(event: MessageEvent): Promise<void> {
  const messageFromFrontend = event.data
  switch (messageFromFrontend.action) {
    case 'startTimespan':
    case 'endTimespan':
    case 'snapshot':
    case 'navigation': {
      const result = await invokeLH(messageFromFrontend.action, messageFromFrontend.args)
      if (result && typeof result === 'object') {
        // Report isn't used upstream.
        if ('report' in result) {
          delete result.report
        }

        // Logger PerformanceTiming objects cannot be cloned by this worker's `postMessage` function.
        if ('artifacts' in result) {
          // @ts-expect-error
          result.artifacts.Timing = JSON.parse(JSON.stringify(result.artifacts.Timing))
        }
      }
      self.postMessage({ id: messageFromFrontend.id, result })
      break
    }
    case 'dispatchProtocolMessage': {
      console.log('dispatch', messageFromFrontend)
      cdpConnection?.onMessage?.(messageFromFrontend.args.message)
      break
    }
    default: {
      throw new Error(`Unknown event: ${event.data}`)
    }
  }
}

self.onmessage = onFrontendMessage

// Make lighthouse and traceviewer happy.

globalThis.global = self
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.isVinn = true
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.document = {}
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.document.documentElement = {}
// @ts-expect-error https://github.com/GoogleChrome/lighthouse/issues/11628
globalThis.global.document.documentElement.style = {
  WebkitAppearance: 'WebkitAppearance',
}
