/* eslint-disable @typescript-eslint/no-misused-promises */
import lighthouse from 'lighthouse'

import { ParallelConnectionInterface } from './lab/services/connection'
import { CDPSession, Page, Connection, ConnectionTransport } from './puppeteer'
import { CdpTarget } from 'puppeteer-core/lib/esm/puppeteer/puppeteer-core'

window.__PUPPETEER_DEBUG = '*'

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

  async sendRawMessage(message: string): Promise<void> {
    const { method, params, id } = JSON.parse(message)
    const result = await chrome.debugger.sendCommand({ tabId: chrome.devtools.inspectedWindow.tabId }, method, params)
    this.onMessage?.({ id, result })
  }

  async disconnect(): Promise<void> {
    this.onDisconnect?.('force disconnect')
    this.onDisconnect = null
    this.onMessage = null
    return Promise.resolve()
  }
}

class Transport implements ConnectionTransport {
  #connection: ParallelConnectionInterface

  constructor(connection: ParallelConnectionInterface) {
    this.#connection = connection
  }

  send(data: string): void {
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

const button = document.querySelector('#take-snapshot') as HTMLButtonElement
button?.addEventListener('click', async () => {
  const url: string = await new Promise((resolve) =>
    chrome.devtools.inspectedWindow.eval('location.href', {}, (result) => {
      resolve(result.value)
    }),
  )
  const mainSessionId = ''
  const connectionProxy = new ConnectionProxy(mainSessionId)
  const cdpSession = new CDPSession(
    new Connection('', new Transport(connectionProxy)),
    'page',
    mainSessionId,
    undefined,
  )
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
  }

  chrome.debugger.onEvent.addListener((_source, method, params) => {
    console.log('debugger.onEvent', method, params)
    connectionProxy.onMessage?.({ method, params })
  })

  await new Promise<void>((resolve) =>
    chrome.debugger.attach({ tabId: chrome.devtools.inspectedWindow.tabId }, '1.3', resolve),
  )
  const page = await Page._create(cdpSession, cdpTarget as any, true, null)
  const runnerResult = await lighthouse(url, undefined, undefined, page as any)
  console.log(runnerResult)
  await chrome.debugger.detach({ tabId: chrome.devtools.inspectedWindow.tabId })
})
