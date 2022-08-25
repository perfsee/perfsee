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

import { inspect } from 'util'

import { red, blue, green, yellow } from 'chalk'
import { identity } from 'lodash'
import { createLogger as createWinstonLogger, format, transports } from 'winston'
import Transport from 'winston-transport'

import { JobLogLevel } from '@perfsee/shared'

import { IS_WORKER_PROCESS } from '../constants'

export function createLogger() {
  // winston.format.colorize will change the level and message themselves
  // which would disturb saving logs in storage
  function getColorizer(level: string) {
    const levelColors = {
      error: red,
      warn: yellow,
      info: blue,
      verbose: green,
    }

    return levelColors[level] ?? identity
  }
  const winstonLogger = createWinstonLogger({
    level: process.env.VERBOSE || IS_WORKER_PROCESS ? 'verbose' : 'info',
    format: format.combine(
      format.metadata(),
      format.timestamp(),
      format.printf(({ level, message, timestamp, metadata }) => {
        return [
          `[${IS_WORKER_PROCESS ? 'Worker' : 'Runner'}]`,
          '-',
          timestamp,
          getColorizer(level)(level.toUpperCase().padStart(8)),
          message,
          Object.keys(metadata).length && inspect(metadata, false, 4),
        ]
          .filter(Boolean)
          .join(' ')
      }),
    ),
    transports: [new transports.Console()],
  })

  if (IS_WORKER_PROCESS) {
    class SendMessageTransport extends Transport {
      log(info: any, callback: () => void) {
        setImmediate(() => this.emit('logged', info))
        const payload = [
          JobLogLevel[info.level] ?? JobLogLevel.verbose,
          new Date(info.timestamp).getTime(),
          info.message,
        ]
        if (Object.keys(info.metadata).length) {
          if (info.metadata['error']) {
            payload.push({ ...info.metadata, error: info.metadata['error'].message })
          } else {
            payload.push(info.metadata)
          }
        }
        process.send?.({
          type: 'log',
          payload,
        })
        callback()
      }
    }
    winstonLogger.add(new SendMessageTransport())
  }

  return winstonLogger
}

export const logger = createLogger()

export type AbstractJobLogger = {
  [Key in keyof typeof JobLogLevel]: Key extends number
    ? never
    : (message: string, data?: Record<string, any> & { error?: unknown }) => void
}
