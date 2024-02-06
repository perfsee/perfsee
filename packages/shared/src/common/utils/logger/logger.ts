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

import { Injectable } from '@sigi/di'
import { noop } from 'lodash'
import { Subject, from, of as just, isObservable } from 'rxjs'
import { mergeMap, filter } from 'rxjs/operators'

import { LogLevel, Level, Adapter } from './shared'

export interface MessageStream {
  level: LogLevel
  message: any
  query?: Record<string, any>
}

@Injectable()
export class Logger {
  private static readonly fakeLogger = ['log', 'info', 'warn', 'error', 'fatal'].reduce(
    (fakeLogger, key) => ({ ...fakeLogger, [key]: noop }),
    {},
  ) as Logger

  protected adapters: Adapter[] = []

  private readonly logLevel = Level

  private readonly stream$ = new Subject<MessageStream>()

  constructor() {
    this.stream$
      .pipe(
        filter(({ message: msgOrError }) => {
          if (msgOrError instanceof Error) {
            const errMsg = msgOrError.message
            return !/Failed to execute '(insertBefore|removeChild)' on 'Node'/.test(errMsg)
          }
          return true
        }),
        mergeMap(({ level, message, query }) => {
          return from(this.adapters).pipe(
            mergeMap((adapter) => {
              const result = adapter.log(level, message, query)
              if (result && (isObservable(result) || typeof result.then === 'function')) {
                return result
              }
              return just(result)
            }),
          )
        }),
      )
      .subscribe()
  }

  if(shouldLog: boolean): Logger {
    return shouldLog ? this : Logger.fakeLogger
  }

  log(message: string, query?: Record<string, any>) {
    this.pipe(this.logLevel.log, message, query)
  }

  info(message: string, query?: Record<string, any>) {
    this.pipe(this.logLevel.info, message, query)
  }

  warn(message: string, query?: Record<string, any>) {
    this.pipe(this.logLevel.warn, message, query)
  }

  error(message: string, error: Error, query?: Record<string, any>) {
    this.pipe(this.logLevel.error, message, { ...query, stack: error.stack })
  }

  fatal(message: string, error: Error, query?: Record<string, any>) {
    this.pipe(this.logLevel.fatal, message, { ...query, stack: error.stack })
  }

  addAdapter(adaper: Adapter) {
    this.adapters.push(adaper)
  }

  private pipe(level: typeof Level[keyof typeof Level], message: string, query: any) {
    return this.stream$.next({ level, message, query })
  }
}
