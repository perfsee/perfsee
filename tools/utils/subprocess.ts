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

import { execSync, spawn as RawSpawn, ChildProcess, SpawnOptions } from 'child_process'
import { performance } from 'perf_hooks'

import { Logger } from './log'

/* eslint-disable-next-line sonarjs/no-unused-collection */
const children = new Set<ChildProcess>()

export function spawn(tag: string, cmd: string | string[], options: SpawnOptions = {}) {
  cmd = typeof cmd === 'string' ? cmd.split(' ') : cmd
  const isYarnSpawn = cmd[0] === 'yarn'

  const spawnOptions: SpawnOptions = {
    stdio: isYarnSpawn ? ['inherit', 'inherit', 'inherit'] : ['inherit', 'pipe', 'pipe'],
    shell: true,
    ...options,
    env: { ...process.env, ...(options.env ?? {}) },
  }

  const logger = new Logger(isYarnSpawn ? '' : tag)
  !isYarnSpawn && logger.info(cmd.join(' '))
  const childProcess = RawSpawn(cmd[0], cmd.slice(1), spawnOptions)
  children.add(childProcess)

  const drain = (_code: number | null, signal: any) => {
    children.delete(childProcess)

    // don't run repeatedly if this is the error event
    if (signal === undefined) {
      childProcess.removeListener('exit', drain)
    }
  }

  childProcess.stdout?.on('data', (chunk) => {
    logger.log(chunk)
  })

  childProcess.stderr?.on('data', (chunk) => {
    logger.error(chunk)
  })

  childProcess.once('error', (e) => {
    logger.error(e.toString())
    children.delete(childProcess)
  })

  childProcess.once('exit', (code, signal) => {
    if (code !== 0) {
      logger.error('Finished with non-zero exit code.')
    }

    drain(code, signal)
  })

  return childProcess
}

export function execAsync(tag: string, cmd: string | string[], options?: SpawnOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const childProcess = spawn(tag, cmd, options)

    childProcess.once('error', (e) => {
      reject(e)
    })

    childProcess.once('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Child process exits with non-zero code ${code}`))
      }
    })
  })
}

export function exec(tag: string, cmd: string, { silent }: { silent: boolean } = { silent: false }): string {
  const logger = new Logger(tag)
  !silent && logger.info(cmd)
  const result = execSync(cmd, { encoding: 'utf8' }).trim()
  !silent && logger.log(result)
  return result
}

interface ParallelRunnerOptions {
  concurrency?: number
  noBail?: boolean
}

export async function runParallel(
  names: string[],
  run: (name: string) => Promise<any>,
  options: ParallelRunnerOptions = { concurrency: 3 },
) {
  const runningPackages: Set<string> = new Set()
  const returnedValues: any[] = []
  const thrownErrors: any[] = []
  return new Promise((resolve, reject) => {
    const runNextPackage = () => {
      const name = names.shift()
      if (name) {
        runningPackages.add(name)
        void run(name)
          .then((value) => {
            returnedValues.push(value)
            runNextPackage()
          })
          .catch((err) => {
            if (options.noBail) {
              thrownErrors.push(err)
            } else {
              reject(err)
            }
          })
          .finally(() => {
            runningPackages.delete(name)
            if (runningPackages.size === 0) {
              if (thrownErrors.length) {
                reject(thrownErrors)
              } else {
                resolve(returnedValues)
              }
            }
          })
      }
    }

    while (options.concurrency!--) {
      runNextPackage()
    }
  })
}

export async function dispatchParallelJobs(
  scriptName: string,
  job: (name: string) => Promise<any>,
  packagesToRun: string[] = [],
  concurrency = 3,
) {
  const logger = new Logger(scriptName)
  const run = async (packageName: string) => {
    const startTime = performance.now()
    logger.info(`Start running ${scriptName} in [${packageName}] package`)
    await job(packageName)
    logger.success(`[${packageName}] ✨ Done in ${((performance.now() - startTime) / 1000).toFixed(2)}s`)
  }

  try {
    await runParallel(packagesToRun, run, { concurrency, noBail: true })
  } catch (e) {
    process.exit((e as { code?: number }).code ?? 1)
  }
}
