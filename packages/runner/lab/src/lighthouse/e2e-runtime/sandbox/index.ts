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

import { VM } from 'vm2'

import { hasTopLevelAwait } from './util'

export function createSandbox(global: any, onConsole: (method: string, message: string) => void) {
  const makeConsoleMethod =
    (method: string) =>
    (...args: any[]) => {
      onConsole(method, args.map((a) => inspect(a)).join(' '))
    }

  return {
    async run(code: string) {
      const functionBody = hasTopLevelAwait(code) ? code : 'return eval(global.__code)'

      return new Promise((resolve, reject) => {
        const vm = new VM({
          sandbox: {
            ...global,
            console: {
              assert: (assertion: boolean, ...args: any[]) => {
                if (!assertion) {
                  makeConsoleMethod('assert')(...args)
                }
              },
              clear: makeConsoleMethod('clear'),
              count: makeConsoleMethod('count'),
              countReset: makeConsoleMethod('countReset'),
              debug: makeConsoleMethod('debug'),
              dir: makeConsoleMethod('dir'),
              dirxml: makeConsoleMethod('dirxml'),
              error: makeConsoleMethod('error'),
              group: makeConsoleMethod('group'),
              groupCollapsed: makeConsoleMethod('groupCollapsed'),
              groupEnd: makeConsoleMethod('groupEnd'),
              info: makeConsoleMethod('info'),
              log: makeConsoleMethod('log'),
              table: makeConsoleMethod('table'),
              time: makeConsoleMethod('time'),
              timeEnd: makeConsoleMethod('timeEnd'),
              timeLog: makeConsoleMethod('timeLog'),
              trace: makeConsoleMethod('trace'),
              warn: makeConsoleMethod('warn'),
            },
            setImmediate,
            setInterval,
            setTimeout,
            exit: resolve,
            error: reject,
            __code: code,
          },
        })
        vm.run(`
        const exit = global.exit;
        const error = global.error;
        const process = {
          exit: (val) => val === 0 ? exit(val) : error('Script exit with errors'),
        };

        void ((async () => { ${functionBody} })()).then(resolve => exit(resolve), e => error(e));
        `)
      })
    },
  }
}
