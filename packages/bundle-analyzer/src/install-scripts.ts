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
import { createHash } from 'crypto'
import { mkdir, rm, stat, readdir } from 'fs/promises'
import { join } from 'path'
import { Readable } from 'stream'

import { extract } from 'tar'

import { Logger } from './stats-parser/types'

type RunnerScriptResponse = {
  version: string
  storageKey: string
  sha256: string
}

const currentRunnerScript: { [jobType: string]: string } = {}
export const installActivatedRunnerScript = (
  logger: Logger,
  fetch: (url: string, init?: RequestInit) => Promise<any>,
  cacheDir: string = join(__dirname, '../tmp'),
) => {
  return async (jobType: string): Promise<string | undefined> => {
    // 1. Check activated runner script version
    logger.info(`Check activated runner script version for ${jobType}`)
    let res = await fetch(`/api/runners/scripts/${jobType}/activated`)
    if (res.status === 204) {
      logger.info(`No activated runner script version for ${jobType}`)
      return undefined
    }
    if (res.status !== 200) {
      throw new Error(`Failed to fetch activated runner script for ${jobType}`)
    }
    const script = (await res.json()) as RunnerScriptResponse | undefined
    if (!script) {
      return undefined
    }

    const packageFolder = join(cacheDir, 'runner-scripts', `${jobType}:${script.version}`)
    try {
      if ((await stat(packageFolder)).isDirectory()) {
        return packageFolder
      }
    } catch (_) {
      // runner script folder not found, need download
    }

    // 2. download runner script
    const downloadUrl = `/api/runners/scripts/${jobType}/${script.version}/download`
    logger.info(`Download runner script ${downloadUrl}`)
    res = await fetch(downloadUrl)
    if (res.status !== 200) {
      throw new Error(
        `Failed to download runner script for ${jobType} ${script.version} ${res.statusText}: ${await res.text()}`,
      )
    }
    const zipped = await res.buffer()

    // 3. check hash
    logger.info(`Checking hash`)
    const sha256 = createHash('sha256').update(zipped).digest('base64')
    if (sha256 !== script.sha256) {
      throw new Error(`Downloaded runner script hash mismatch for ${jobType} ${script.version}`)
    }

    // 4. unzip
    logger.info(`Unzip runner script`)
    try {
      await rm(packageFolder, { force: true, recursive: true })
      await mkdir(packageFolder, { recursive: true })
      await new Promise((resolve, reject) => {
        Readable.from(zipped)
          .pipe(
            extract({
              cwd: packageFolder,
            }),
          )
          .on('finish', () => {
            resolve(packageFolder)
          })
          .on('error', (e) => {
            reject(e)
          })
      })
    } catch (e) {
      // rollback
      await rm(packageFolder, { force: true, recursive: true })
      throw e
    }

    // 5. keep the previous one version, delete the old versions
    const scriptsFolder = join(cacheDir, 'runner-scripts')

    // read existing runner script versions, E.g. ["job.LabAnalyze:1.0.0", "job.LabAnalyze:1.0.1"]
    try {
      const versions = (await readdir(scriptsFolder)).filter((name) => name.startsWith(`${jobType}:`))
      const newVersion = `${jobType}:${script.version}`
      const prevVersion = `${jobType}:${currentRunnerScript[jobType]}`
      const deleteVersions = versions.filter((name) => name !== newVersion && name !== prevVersion)
      for (const name of deleteVersions) {
        const folder = join(scriptsFolder, name)
        logger.info(`Remove old runner script ${folder}`)
        await rm(folder, { force: true, recursive: true })
      }
    } catch (e) {
      logger.error('Failed to remove old runner script, reason: ', e)
    }

    currentRunnerScript[jobType] = script.version

    return packageFolder
  }
}
