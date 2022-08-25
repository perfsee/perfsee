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

import { UpdateJobEvent } from '@perfsee/server-common'

import { AbstractJobLogger, logger } from './logger'
import { PlatformClient } from './platform-client'
import { WorkerData, WorkerMessage } from './types'

export abstract class JobWorker<Payload = any> {
  protected ended = false
  protected client: PlatformClient
  protected readonly startedAt = new Date()

  get timeSpent() {
    return Date.now() - this.startedAt.getTime()
  }

  get job() {
    return this.workerData.job
  }

  get payload() {
    return this.workerData.job.payload as Payload
  }

  get logger() {
    return logger as unknown as AbstractJobLogger
  }

  constructor(private readonly workerData: WorkerData<Payload>) {
    this.client = new PlatformClient(this.workerData.server)
  }

  /**
   * `run` will never throw
   */
  async run() {
    try {
      this.postMessage('start', undefined)
      this.logger.info(`Start working on job: '${this.job.jobType}'.`, this.payload)
      this.logger.verbose(`Start working at: ${this.startedAt.toISOString()}.`)

      this.logger.info('Start running preparation scripts.')
      await this.before()
      this.logger.info('Preparation finished.')

      this.logger.info('Start analyzing.')
      await this.work()
      this.logger.info('Analyzing finished.')

      this.logger.info('Cleaning up worker.')
      await this.after()
      this.logger.info('Job finished.')
    } catch (e) {
      this.logger.error('Error occurred during job run', { error: e })
      this.onError(e instanceof Error ? e : new Error('Error occurred during job run: ' + `${e}`))
    } finally {
      this.end()
    }
  }

  /**
   * a special function used to raise job error from parent thread.
   * DO NOT CALL IT IN WORKER PROCESS!
   */
  raise(reason: string) {
    this.logger.error(`job terminated: ${reason}`)
    // throw error to worker implementations to
    // let them do correct react to unfinished job working.
    this.onError(new Error(reason))
    this.postMessage('raised', undefined)
    this.end()
  }

  protected async before() {
    this.logger.info('Nothing need to be prepared.')
    return Promise.resolve()
  }

  protected abstract work(): Promise<any>

  protected async after() {
    this.logger.info('Nothing need to be cleaned up.')
    return Promise.resolve()
  }

  protected updateJob(event: UpdateJobEvent) {
    this.logger.info('Event emitted to server.', { type: event.type })
    this.postMessage('event', event)
  }

  /*
   * callback called when any error threw from `before`, `work` and `after` logic.
   */
  protected onError(error: Error) {
    this.fatal(error)
  }

  protected fatal(error: Error) {
    if (!this.ended) {
      this.logger.error('a fatal error met.', error)
      this.end()
    }
  }

  private postMessage<T extends WorkerMessage['type']>(
    type: T,
    payload: Extract<WorkerMessage, { type: T }>['payload'],
  ) {
    process.send?.({ type, payload })
  }

  /**
   * After sending end message to parent, parent will send `shutdown` message back to worker thread,
   * which could make sure all preceding messages have already received by parent successfully.
   */
  private end() {
    if (!this.ended) {
      this.ended = true
      this.postMessage('end', undefined)
    }
  }
}
