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

import fs from 'fs'
import { join } from 'path'

import { AuditParam, Logger } from '../types'

function dynamicImport(specifier: string): Promise<any> {
  // eslint-disable-next-line
  return new Function('specifier', 'return import(specifier)')(specifier)
}

export const runInVm = async (
  rule: string,
  script: string,
  assetsPath: string,
  params: Readonly<AuditParam>,
  logger: Logger,
) => {
  const ivm = (await dynamicImport('isolated-vm')).default as typeof import('isolated-vm')
  const isolate = new ivm.Isolate({ memoryLimit: 1024 })
  const context = await isolate.createContext()
  const jail = context.global
  await jail.set('global', jail.derefInto())
  await jail.set('params', new ivm.ExternalCopy(params).copyInto())

  await jail.set('_ivm', ivm)
  await jail.set(
    '_log',
    new ivm.Reference(function (...args: any[]) {
      logger.verbose(`Verbose from audit ${rule}: `, JSON.stringify(args))
    }),
  )
  await jail.set(
    '_info',
    new ivm.Reference(function (...args: any[]) {
      logger.info(`Info from audit ${rule}: `, JSON.stringify(args))
    }),
  )
  await jail.set(
    '_error',
    new ivm.Reference(function (...args: any[]) {
      logger.error(`Error from audit ${rule}: `, JSON.stringify(args))
    }),
  )
  await jail.set(
    '_warn',
    new ivm.Reference(function (...args: any[]) {
      logger.warn(`Warn from audit ${rule}: `, JSON.stringify(args))
    }),
  )

  await jail.set(
    '_getAssetSource',
    new ivm.Reference((assetPathOrName: string) => {
      const path = params.assets.find((asset) => asset.name === assetPathOrName || asset.path === assetPathOrName)?.path
      if (!path) {
        return new ivm.ExternalCopy(null).copyInto()
      }
      try {
        const content = fs.readFileSync(join(assetsPath, path), 'utf-8')
        return new ivm.ExternalCopy(content).copyInto()
      } catch (e) {
        return new ivm.ExternalCopy(null).copyInto()
      }
    }),
  )

  /* eslint-disable */
  let bootstrap = isolate.compileScriptSync(
    'new ' +
      function () {
        // @ts-expect-error
        let ivm = _ivm
        // @ts-expect-error
        delete global._ivm

        // @ts-expect-error
        let __log = global._log
        // @ts-expect-error
        let __info = global._info
        // @ts-expect-error
        let __error = global._error
        // @ts-expect-error
        let __warn = global._warn
        // @ts-expect-error
        global.console = {
          log: function (...args) {
            __log.apply(
              undefined,
              args.map((arg) => new ivm.ExternalCopy(arg).copyInto()),
            )
          },
          info: function (...args) {
            __info.apply(
              undefined,
              args.map((arg) => new ivm.ExternalCopy(arg).copyInto()),
            )
          },
          error: function (...args) {
            __error.apply(
              undefined,
              args.map((arg) => new ivm.ExternalCopy(arg).copyInto()),
            )
          },
          warn: function (...args) {
            __warn.apply(
              undefined,
              args.map((arg) => new ivm.ExternalCopy(arg).copyInto()),
            )
          },
        }
        // @ts-expect-error
        delete global._log
        // @ts-expect-error
        delete global._info
        // @ts-expect-error
        delete global._error
        // @ts-expect-error
        delete global._warn

        // @ts-expect-error
        let __getAssetSource: ivm.Reference<(file: string) => Promise<string>> = _getAssetSource
        // @ts-expect-error
        delete global._getAssetSource

        // @ts-expect-error
        global.getAssetSource = async (assetPath: string) => {
          return __getAssetSource.apply(undefined, [new ivm.ExternalCopy(assetPath).copyInto()])
        }
      },
  )
  /* eslint-enable */

  await bootstrap.run(context)

  const hostile = await isolate.compileScript(script)
  const runResult = await hostile.run(context, { timeout: 30 * 1000, promise: true, reference: true })

  let result
  if (runResult) {
    result = await runResult.copy()
    runResult.release()
  }

  hostile.release()
  bootstrap.release()
  context.release()
  isolate.dispose()
  return result
}
