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

import settings from '../settings'

export default class Logger {
  static debug(...message: any[]) {
    if (settings.debug) {
      // eslint-disable-next-line no-console
      console.log(...message)
    }
  }

  static info(...message: any[]) {
    // eslint-disable-next-line no-console
    console.log(...message)
  }

  static err(...message: any[]) {
    // eslint-disable-next-line no-console
    console.error(...message)
  }

  static startTime(): [number, number] {
    return process.hrtime()
  }

  static endTime(name: string, starttime: [number, number]) {
    const [secs, nanosecs] = process.hrtime(starttime)

    Logger.debug(`[function:${name}] - ${secs * 1000 + nanosecs / 1000000}ms`)
  }

  /**
   * logging the duration execute function
   * @param name function name
   * @example const wrappedFunc = withTime("functionName")(() => {...long time code})
   */
  static trace(name: string) {
    return <T extends (...arg: any[]) => any>(fn: T): T => {
      return ((...arg: any[]) => {
        if (settings.debug) {
          const startTime = Logger.startTime()
          const result = fn(...arg)
          Logger.endTime(name, startTime)
          return result
        } else {
          return fn(...arg)
        }
      }) as T
    }
  }

  static LogTime<T>(
    target: any,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>,
  ): TypedPropertyDescriptor<T> {
    const func = target[propertyKey]

    descriptor.value = function (this: any, ...params: any[]) {
      if (settings.debug) {
        const startTime = Logger.startTime()

        const result = func.apply(this, params)

        Logger.endTime(String(propertyKey), startTime)
        return result
      } else {
        return func.apply(this, params)
      }
    } as unknown as T

    return descriptor
  }
}
