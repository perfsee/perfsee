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

import { logger } from './logger'
import { ParentMessage, WorkerData } from './types'
import { JobWorker } from './worker'

export function workerMain(createWorker: (data: WorkerData) => JobWorker<any>) {
  let worker: JobWorker<any> | null = null
  async function executeJob(workerData: WorkerData) {
    worker = createWorker(workerData)
    await worker.run()
  }

  process.on('message', (message: ParentMessage) => {
    logger.info(`receive ${message.type} message from parent`)
    switch (message.type) {
      case 'start': {
        void executeJob(message.payload)
        break
      }
      case 'raise': {
        worker?.raise(message.payload)
        break
      }
      case 'shutdown': {
        process.exit()
      }
    }
  })
  process.send?.({ type: 'alive' })
  process
    .on('unhandledRejection', (reason, _) => {
      logger.error('Unhandled Rejection at Promise ' + (reason instanceof Error ? reason.stack : reason))
    })
    .on('uncaughtException', (err) => {
      logger.error('Uncaught Exception thrown ' + (err instanceof Error ? err.stack : err))
    })
}

export { JobWorker } from './worker'
export { logger } from './logger'
export * from './types'
export * from './constants'
export * from './logger'
