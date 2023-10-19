// Copyright 2018 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

import { CDPConnection } from './cdp'
import { Connection, ParallelConnection } from './connection'

/**
 * @overview
                                                   ┌────────────┐
                                                   │CDP Backend │
                                                   └────────────┘
                                                        │ ▲
                                                        │ │ parallelConnection
                          ┌┐                            ▼ │                     ┌┐
                          ││   dispatchProtocolMessage     sendProtocolMessage  ││
                          ││                     │          ▲                   ││
          ProtocolService ││                     |          │                   ││
                          ││    sendWithResponse ▼          │                   ││
                          ││              │    send          onWorkerMessage    ││
                          └┘              │    │                 ▲              └┘
          worker boundary - - - - - - - - ┼ - -│- - - - - - - - -│- - - - - - - - - - - -
                          ┌┐              ▼    ▼                 │                    ┌┐
                          ││   onFrontendMessage      notifyFrontendViaWorkerMessage  ││
                          ││                   │       ▲                              ││
                          ││                   ▼       │                              ││
LighthouseWorkerService   ││          Either ConnectionProxy or LegacyPort            ││
                          ││                           │ ▲                            ││
                          ││     ┌─────────────────────┼─┼───────────────────────┐    ││
                          ││     │  Lighthouse    ┌────▼──────┐                  │    ││
                          ││     │                │connection │                  │    ││
                          ││     │                └───────────┘                  │    ││
                          └┘     └───────────────────────────────────────────────┘    └┘

 * All messages traversing the worker boundary are action-wrapped.
 * All messages over the parallelConnection speak pure CDP.
 * All messages within ConnectionProxy/LegacyPort speak pure CDP.
 * The foundational CDP connection is `parallelConnection`.
 * All connections within the worker are not actual ParallelConnection's.
 */

let lastId = 1

export interface LighthouseRun {
  inspectedURL: string
  categoryIDs: string[]
  flags: Record<string, any | undefined>
}

export interface RunnerResult {}

/**
 * ProtocolService manages a connection between the frontend (Lighthouse panel) and the Lighthouse worker.
 */
export class ProtocolService {
  private mainSessionId?: string
  private rootTargetId?: string = 'FB91B7A60093286F62601E0AFB8DC941'
  private parallelConnection?: Connection
  private lighthouseWorkerPromise?: Promise<Worker>
  private lighthouseMessageUpdateCallback?: (arg0: string) => void

  async attach(): Promise<void> {
    chrome.debugger.onEvent.addListener((source, method, params) => {
      console.log('debugger.onEvent', method, params)
      this.parallelConnection?.onMessage({ method, params, sessionId: '1' })
    })
    const connection = new CDPConnection()
    this.parallelConnection = new ParallelConnection(connection, '')
    window.connection = this.parallelConnection
    const tab = await chrome.tabs.get(chrome.devtools.inspectedWindow.tabId)
    console.log('session', (await chrome.sessions.getRecentlyClosed())[0])
    const sessionId = tab.sessionId ?? (await chrome.sessions.getRecentlyClosed())[0].tab.sessionId
    this.mainSessionId = sessionId!
    this.parallelConnection.setOnMessage((msg) => this.dispatchProtocolMessage(msg))
  }

  async startTimespan(currentLighthouseRun: LighthouseRun): Promise<void> {
    const { inspectedURL, categoryIDs, flags } = currentLighthouseRun

    await this.sendWithResponse('startTimespan', {
      url: inspectedURL,
      categoryIDs,
      flags,
      mainSessionId: this.mainSessionId,
      rootTargetId: this.rootTargetId,
    })
  }

  async collectLighthouseResults(currentLighthouseRun: LighthouseRun): Promise<RunnerResult> {
    const { inspectedURL, categoryIDs, flags } = currentLighthouseRun

    let mode = flags.mode as string
    if (mode === 'timespan') {
      mode = 'endTimespan'
    }

    return this.sendWithResponse(mode, {
      url: inspectedURL,
      categoryIDs,
      flags,
      mainSessionId: this.mainSessionId,
      rootTargetId: this.rootTargetId,
    })
  }

  async detach(): Promise<void> {
    const oldLighthouseWorker = this.lighthouseWorkerPromise
    const oldParallelConnection = this.parallelConnection

    // When detaching, make sure that we remove the old promises, before we
    // perform any async cleanups. That way, if there is a message coming from
    // lighthouse while we are in the process of cleaning up, we shouldn't deliver
    // them to the backend.
    this.lighthouseWorkerPromise = undefined
    this.parallelConnection = undefined

    if (oldLighthouseWorker) {
      ;(await oldLighthouseWorker).terminate()
    }
    if (oldParallelConnection) {
      await oldParallelConnection.disconnect()
    }
  }

  registerStatusCallback(callback: (arg0: string) => void): void {
    this.lighthouseMessageUpdateCallback = callback
  }

  private dispatchProtocolMessage(message: any): void {
    // A message without a sessionId is the main session of the main target (call it "Main session").
    // A parallel connection and session was made that connects to the same main target (call it "Lighthouse session").
    // Messages from the "Lighthouse session" have a sessionId.
    // Without some care, there is a risk of sending the same events for the same main frame to Lighthouse–the backend
    // will create events for the "Main session" and the "Lighthouse session".
    // The workaround–only send message to Lighthouse if:
    //   * the message has a sessionId (is not for the "Main session")
    //   * the message does not have a sessionId (is for the "Main session"), but only for the Target domain
    //     (to kickstart autoAttach in LH).

    void this.send('dispatchProtocolMessage', { message })
  }

  private initWorker(js: string): Promise<Worker> {
    this.lighthouseWorkerPromise = new Promise<Worker>((resolve) => {
      const blob = new Blob([js], { type: 'text/javascript' })
      const blobUrl = window.URL.createObjectURL(blob)
      const workerUrl = new URL(blobUrl)
      const remoteBaseSearchParam = new URL(self.location.href).searchParams.get('remoteBase')
      if (remoteBaseSearchParam) {
        // Allows Lighthouse worker to fetch remote locale files.
        workerUrl.searchParams.set('remoteBase', remoteBaseSearchParam)
      }
      const worker = new Worker(workerUrl, { type: 'module' })

      worker.addEventListener('message', (event) => {
        if (event.data === 'workerReady') {
          resolve(worker)
          return
        }

        this.onWorkerMessage(event)
      })
    })
    return this.lighthouseWorkerPromise
  }

  private async ensureWorkerExists(): Promise<Worker> {
    let worker: Worker
    if (!this.lighthouseWorkerPromise) {
      const js = await fetch('http://127.0.0.1:5500/packages/chrome-extension/dist/lighthouse-worker.js')
      worker = await this.initWorker(await js.text())
    } else {
      worker = await this.lighthouseWorkerPromise
    }
    return worker
  }

  private onWorkerMessage(event: MessageEvent): void {
    const lighthouseMessage = event.data

    if (lighthouseMessage.action === 'statusUpdate') {
      if (this.lighthouseMessageUpdateCallback && lighthouseMessage.args && 'message' in lighthouseMessage.args) {
        this.lighthouseMessageUpdateCallback(lighthouseMessage.args.message as string)
      }
    } else if (
      lighthouseMessage.action === 'sendProtocolMessage' &&
      lighthouseMessage.args &&
      'message' in lighthouseMessage.args
    ) {
      this.sendProtocolMessage(lighthouseMessage.args.message as string)
    }
  }

  private sendProtocolMessage(message: string): void {
    if (this.parallelConnection) {
      this.parallelConnection.sendRawMessage(message)
    }
  }

  private async send(
    action: string,
    args: { [x: string]: string | string[] | Record<string, any> } = {},
  ): Promise<void> {
    const worker = await this.ensureWorkerExists()
    const messageId = lastId++
    worker.postMessage({ id: messageId, action, args: { ...args, id: messageId } })
  }

  /** sendWithResponse currently only handles the original startLighthouse request and LHR-filled response. */
  private async sendWithResponse(
    action: string,
    args: { [x: string]: string | string[] | Record<string, any> | undefined } = {},
  ): Promise<RunnerResult> {
    const worker = await this.ensureWorkerExists()
    const messageId = lastId++
    const messageResult = new Promise<RunnerResult>((resolve) => {
      const workerListener = (event: MessageEvent): void => {
        const lighthouseMessage = event.data

        if (lighthouseMessage.id === messageId) {
          worker.removeEventListener('message', workerListener)
          resolve(lighthouseMessage.result)
        }
      }
      worker.addEventListener('message', workerListener)
    })
    worker.postMessage({ id: messageId, action, args: { ...args, id: messageId } })

    return messageResult
  }
}
