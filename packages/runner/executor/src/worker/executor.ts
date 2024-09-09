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

import { ChildProcess, fork } from 'child_process'
import { EventEmitter } from 'events'

import { ParentMessage, RunnerConfig, WorkerMessage, logger } from '@perfsee/job-runner-shared'
import { JobInfo, UpdateJobTraceParams } from '@perfsee/server-common'
import { JobLog, JobLogLevel } from '@perfsee/shared'

const MAX_PUSH_RETRY_TIMES = 3

export class JobWorkerExecutor extends EventEmitter {
  private workerProcess: ChildProcess | null = null
  private readonly logs: JobLog[] = []
  private startedAt = -1

  private updateFailedTimes = 0
  private lastPushedLogIndex = 0
  private updateLocked = false
  private readonly updatesQueue: Partial<UpdateJobTraceParams>[] = []
  private updatePushInterval!: NodeJS.Timeout
  private timeout!: NodeJS.Timeout

  get duration() {
    if (this.startedAt !== -1) {
      return Date.now() - this.startedAt
    }
    return 0
  }

  constructor(
    private readonly workerEntry: string,
    private readonly job: JobInfo,
    private readonly config: RunnerConfig,
  ) {
    super()
  }

  on(event: 'start', callback: () => void): void
  on(event: 'update', callback: (update: Partial<UpdateJobTraceParams>, done: (error?: any) => void) => void): this
  on(event: 'error', callback: (error: Error) => void): this
  on(event: 'end', callback: () => void): this
  on(event: string, callback: (...args: any[]) => void) {
    return super.on(event, callback)
  }

  emit(event: 'start'): boolean
  emit(event: 'update', update: Partial<UpdateJobTraceParams>, done: (error?: any) => void): boolean
  emit(event: 'error', error: Error): boolean
  emit(event: 'end'): boolean
  emit(event: string, ...args: any[]) {
    return super.emit(event, ...args)
  }
  async start() {
    logger.verbose('starting worker')
    // start the update pusher immediately so we could handle
    // error even like spawn failure
    this.setupUpdatesPusher()
    try {
      this.workerProcess = fork(this.workerEntry, ['worker'])
      logger.verbose('worker spawned', this.workerProcess.pid)
    } catch (e) {
      const error = new Error('failed to spawn worker process: ' + e)
      logger.error(error)
      this.end(error)
      return
    }

    this.workerProcess
      .on('error', (error) => {
        logger.error('worker emits an error', error)
        this.end(error)
      })
      .on('message', this.onMessage.bind(this))

    await this.waitMessage('alive')
    await this.startWorker()
    logger.verbose('worker started')
  }

  async terminateWorker(reason: string) {
    this.sendMessageToWorker('raise', reason)
    await this.waitMessage('raised')
    logger.verbose('worker terminated', { reason })
  }

  private async startWorker() {
    this.sendMessageToWorker('start', {
      job: this.job,
      server: this.config.server,
    })
    await this.waitMessage('start')
    this.startedAt = Date.now()
    this.setupJobTimeout()
    this.emit('start')
  }

  private waitMessage<T extends WorkerMessage['type'], P extends Extract<WorkerMessage, { type: T }>['payload']>(
    message: T,
  ) {
    return new Promise<P>((resolve) => {
      let called = false
      const listener = ({ type, payload }: WorkerMessage) => {
        if (!called && type === message) {
          called = true
          this.workerProcess?.off('message', listener)
          // @ts-expect-error should be right
          resolve(payload)
        }
      }
      this.workerProcess?.on('message', listener)
    })
  }

  private sendMessageToWorker<T extends ParentMessage['type']>(
    type: T,
    payload?: Extract<ParentMessage, { type: T }>['payload'],
  ) {
    this.workerProcess?.send({ type, payload })
  }

  private onMessage(message: WorkerMessage) {
    if (message.type !== 'log') {
      logger.verbose('worker message received', message)
    }

    if (message.type) {
      const msg = message as WorkerMessage

      // use if-else can make ts narrow types
      if (msg.type === 'log') {
        this.logs.push(msg.payload)
        if (!this.updatesQueue.length) {
          this.enqueueUpdates({})
        }
      } else if (msg.type === 'event') {
        this.enqueueUpdates({
          jobUpdates: msg.payload,
        })
      } else if (msg.type === 'end') {
        this.end()
      }
    }
  }

  private setupJobTimeout() {
    const timeout = this.job.timeout ?? this.config.runner.timeout

    this.timeout = setTimeout(() => {
      logger.verbose('worker timeout')
      void this.terminateWorker(`Timeout after ${timeout} seconds.`)
    }, timeout * 1000)
    logger.verbose(`worker job timeout set, will timeout after ${timeout} seconds`)
  }

  private enqueueUpdates(update: Partial<UpdateJobTraceParams>) {
    this.updatesQueue.push(update)
  }

  private setupUpdatesPusher() {
    this.updatePushInterval = setInterval(() => {
      if (!this.updateLocked) {
        const update = this.updatesQueue.shift()
        if (update) {
          this.updateLocked = true
          const pendingLogs = this.lastPushedLogIndex < this.logs.length ? this.logs.slice(this.lastPushedLogIndex) : []

          logger.verbose(`find pending update with ${pendingLogs.length} logs to push`, update)

          this.emit(
            'update',
            {
              ...update,
              trace: pendingLogs,
            },
            (error) => {
              if (error) {
                logger.error('failed to push update', error)
                this.logs.push([JobLogLevel.error, Date.now(), 'Failed to push update to server', String(error)])
                if (++this.updateFailedTimes < MAX_PUSH_RETRY_TIMES) {
                  this.updatesQueue.unshift(update)
                }
              } else {
                logger.verbose('update pushed')
                this.lastPushedLogIndex = pendingLogs.length + this.lastPushedLogIndex
                this.updateFailedTimes = 0

                if (update.done) {
                  logger.verbose('done update pushed')
                  clearInterval(this.updatePushInterval)
                }
              }
              this.updateLocked = false
            },
          )
        }
      }
    }, 3000)

    logger.verbose('updates pusher setup')
  }

  private end(error?: Error) {
    logger.verbose('ending worker')
    clearTimeout(this.timeout)

    if (this.workerProcess) {
      this.workerProcess.off('message', this.onMessage)
      this.sendMessageToWorker('shutdown')
      this.workerProcess = null
    }

    if (error) {
      this.logs.push([JobLogLevel.error, Date.now(), 'error occurred', error.message])
      this.emit('error', error)
    }

    this.enqueueUpdates({
      duration: this.duration,
      done: true,
    })

    this.emit('end')

    logger.verbose('worker ended')
  }
}
