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
import { platform, arch } from 'os'
import { join } from 'path'
import { Readable } from 'stream'

import { merge } from 'lodash'
import fetch, { RequestInit } from 'node-fetch'
import { extract } from 'tar'

import { RunnerConfig, logger } from '@perfsee/job-runner-shared'
import {
  RegisterRunnerParams,
  RegisterRunnerResponse,
  JobRequestParams,
  JobRequestResponse,
  UpdateJobTraceParams,
  UpdateJobTraceResponse,
  RunnerInfo,
  UNKNOWN_RUNNER_ZONE,
  JobType,
  RunnerScriptResponse,
} from '@perfsee/server-common'

const currentRunnerScript: { [jobType: string]: string } = {}

export class PlatformClient {
  constructor(private readonly config: RunnerConfig) {}

  async installActivatedRunnerScript(jobType: string): Promise<string | undefined> {
    // 1. Check activated runner script version
    logger.info(`Check activated runner script version for ${jobType}`)
    let res = await this.fetch(`/api/runners/scripts/${jobType}/activated`)
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

    const packageFolder = join(__dirname, '../tmp', 'runner-scripts', `${jobType}:${script.version}`)
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
    res = await this.fetch(downloadUrl)
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
    const scriptsFolder = join(__dirname, '../tmp', 'runner-scripts')

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

  async registerRunner(name: string, registrationToken: string): Promise<RegisterRunnerResponse | undefined> {
    const body: RegisterRunnerParams = {
      name,
      token: registrationToken,
      info: this.getInfo(),
    }

    try {
      const res = await this.jsonFetch('/api/runners/register', {
        body,
      })

      switch (res.status) {
        case 201:
          logger.info('runner registration succeeded!')
          return (await res.json()) as RegisterRunnerResponse
        case 403:
          logger.error('runner registration failed! (invalid registration token)')
          return
        default:
          logger.error(`runner registration failed! ${res.statusText}: ${await res.text()}`)
          return
      }
    } catch (e) {
      logger.error('runner registration failed! reason: ', e)
    }
  }

  async verifyRunner(): Promise<boolean> {
    try {
      const res = await this.fetch('/api/runners/verify', { method: 'POST' })

      switch (res.status) {
        case 204:
          logger.info('runner verification succeeded!')
          return true
        case 403:
          logger.error('runner verification failed! (invalid runner token)')
          return false
        default:
          logger.error(`runner registration failed! ${res.statusText}: ${await res.text()}`)
          return false
      }
    } catch (e) {
      logger.error('runner verification failed! reason: ', e)
      return false
    }
  }

  async requestJob(): Promise<JobRequestResponse | undefined> {
    const body: JobRequestParams = {
      info: this.getInfo(),
    }

    try {
      const res = await this.jsonFetch('/api/jobs/request', {
        body,
      })

      switch (res.status) {
        case 200:
          return (await res.json()) as JobRequestResponse
        case 403:
          logger.error('request job failed! (invalid runner token)')
          return
        default:
          logger.error(`request job failed! ${res.statusText}: ${await res.text()}`)
          return
      }
    } catch (e) {
      logger.error(`request job failed! reason: `, e)
    }
  }

  async updateJobTrace(params: UpdateJobTraceParams): Promise<UpdateJobTraceResponse | undefined> {
    try {
      const res = await this.jsonFetch('/api/jobs/trace', {
        body: params,
      })

      switch (res.status) {
        case 202:
          return (await res.json()) as UpdateJobTraceResponse
        case 403:
          logger.error('Update job trace failed! (invalid runner token)')
          return
        case 404:
          logger.error('Update job trace failed! (job not found)')
          return
        default:
          logger.error(`Update job trace failed! ${res.statusText}: ${await res.text()}`)
          return
      }
    } catch (e) {
      logger.error('Update job trace failed! reason: ', e)
    }
  }

  async jsonFetch(
    path: string,
    init: Omit<RequestInit, 'body'> & {
      body?: Record<string, any>
    },
  ) {
    const { body, ...options } = init
    return this.fetch(
      path,
      merge(
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        },
        options,
        {
          body: JSON.stringify(body),
        },
      ),
    )
  }

  async fetch(path: string, init?: RequestInit) {
    return this.doFetch(
      path,
      merge(
        {
          headers: {
            'x-runner-token': this.config.server.token,
          },
          timeout: this.config.server.timeout * 1000,
        },
        init,
      ),
    )
  }

  async doFetch(path: string, init?: RequestInit) {
    return fetch(this.config.server.url + path, init)
  }

  private getInfo(): RunnerInfo {
    return {
      name: this.config.name,
      platform: platform(),
      arch: arch(),
      version: this.config.version,
      nodeVersion: process.version,
      zone: process.env.PERFSEE_RUNNER_ZONE ?? UNKNOWN_RUNNER_ZONE,
      extra: {
        jobType: process.env.PERFSEE_RUNNER_TYPE ?? JobType.All,
      },
    }
  }
}
