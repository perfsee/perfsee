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

/* eslint-disable no-console */
import chalk from 'chalk'
import { identity } from 'lodash'

import { newLineSeparator } from './consts'

interface StringLike {
  toString: () => string
}

export class Logger {
  log = this.getLineLogger(console.log.bind(console))
  info = this.getLineLogger(console.info.bind(console), chalk.blue)
  warn = this.getLineLogger(console.warn.bind(console), chalk.bgHex('#322b08').hex('#fadea6'))
  error = this.getLineLogger(console.error.bind(console), chalk.bgHex('#250201').hex('#ef8784'))
  success = this.getLineLogger(console.log.bind(console), chalk.green)

  constructor(private readonly tag = '') {}

  getLineLogger(logLine: (...line: string[]) => void, color: (...text: string[]) => string = identity) {
    return (...args: StringLike[]) => {
      args.forEach((arg) => {
        arg
          .toString()
          .split(newLineSeparator)
          .forEach((line) => {
            if (line.length !== 0) {
              if (this.tag) {
                logLine(color(`[${this.tag}] ${line}`))
              } else {
                logLine(color(line))
              }
            }
          })
      })
    }
  }
}

export const logger = new Logger()
