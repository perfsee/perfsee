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

import { createReadStream, createWriteStream, statSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { Readable, pipeline } from 'stream'
import { promisify } from 'util'
import { createGzip } from 'zlib'

import chalk from 'chalk'
import fetch, { Response } from 'node-fetch'
import { create } from 'tar'
import { v4 as uuid } from 'uuid'

import { PerfseeReportStats } from '@perfsee/bundle-analyzer'
import JSONR from '@perfsee/jsonr'
import { PrettyBytes } from '@perfsee/utils'

import { getBuildEnv } from './build-env'
import { CommonPluginOptions } from './options'

const filteredFields = [
  'identifier',
  'issuerPath',
  'issuer',
  'moduleIdentifier',
  'resolvedModuleIdentifier',
  'parents',
  'siblings',
  'origins',
  'module',
]

function filterOptimizationBailout(optimizationBailout?: string[]): string[] | undefined {
  // ignore commonjs
  if (optimizationBailout?.some((o) => o.includes('CommonJS bailout'))) {
    return
  }

  const filtered = optimizationBailout?.filter((o) => o.includes('with side effects in source code at'))

  return filtered?.length ? filtered : undefined
}

function encodeStatsJson(stats: PerfseeReportStats) {
  return JSONR.stringifyStream(stats, (key, v) =>
    filteredFields.includes(key) ? undefined : key === 'optimizationBailout' ? filterOptimizationBailout(v) : v,
  )
}

export interface BuildUploadParams {
  projectId: string
  host: string
  namespace: string
  name: string
  artifactName: string
  branch: string
  commitHash: string
  commitMessage?: string
  tag?: string
  appVersion?: string
  nodeVersion?: string
  toolkit?: string
  author?: string
  pr?: {
    number: number
    baseHash: string
    headHash: string
  }
}

export class BuildUploadClient {
  constructor(
    private readonly options: CommonPluginOptions,
    private readonly outputPath: string,
    private readonly appVersion: string,
  ) {}

  async uploadBuild(stats: PerfseeReportStats) {
    if (!getBuildEnv().upload) {
      console.info(chalk.yellow('[perfsee] found no upload flag, skip uploading build.'))
      return
    }

    if (!this.options.project) {
      console.info(chalk.yellow('[perfsee] no project id provided, skip uploading build.'))
      return
    }

    if (this.options.processStats) {
      const processedStats = this.options.processStats(stats)
      if (processedStats) {
        stats = processedStats
      } else {
        console.info(chalk.yellow('[perfsee] skip uploading since stats json is empty after process.'))
        return
      }
    }

    try {
      // firstly write stats json down to disk in output path.
      const statsPath = await this.writeStats(stats)

      // then pack the assets in output path
      const packPath = await this.pack(statsPath, stats)

      // then upload the pack to platform
      await this.uploadPack(packPath, stats)

      if (!process.env.KEEP_STATS) {
        unlinkSync(statsPath)
      }
    } catch (e) {
      console.error(chalk.red('[perfsee] Failed to upload build'))
      console.error(chalk.red(String(e)))
    }
  }

  private async writeStats(stats: PerfseeReportStats) {
    const statsFile = join(this.outputPath, `webpack-stats-${uuid()}.jsonr.gz`)

    return new Promise<string>((resolve, reject) => {
      stats.rules = this.options.rules?.filter((rule) => typeof rule === 'string') as string[]
      stats.includeAuxiliary = this.options.includeAuxiliary
      stats.htmlExclusive = this.options.htmlExclusive
      stats.strictChunkRelations = this.options.strictChunkRelations

      pipeline(Readable.from(encodeStatsJson(stats)), createGzip(), createWriteStream(statsFile), (err) => {
        if (err) {
          reject(err)
        } else {
          resolve(statsFile)
        }
      })
    })
  }

  private async pack(statsPath: string, stats: PerfseeReportStats) {
    return new Promise<string>((resolve, reject) => {
      const packPath = `${tmpdir()}/build-${uuid()}.tar.gz`
      const includedAssets = new Set([statsPath])

      stats.assets?.forEach((a) => {
        const asset = join(this.outputPath, a.name)
        includedAssets.add(asset)
        if (/\.m?js$/i.test(asset) || /\.css$/i.test(asset)) {
          includedAssets.add(`${asset}.map`)
        }
      })

      const realOutputPath = this.getRealOutputPath(this.outputPath, stats)

      create(
        {
          cwd: realOutputPath,
          filter: (path) => {
            path = join(realOutputPath, path)
            if (statSync(path).isDirectory()) {
              return true
            }

            // ignore media files to reduce artifact size
            return includedAssets.has(path) && !/\.(mp4|webm|mkv|flv|avi|wmv)$/i.test(path)
          },
        },
        ['./'],
      )
        .pipe(createGzip(this.options.zlibOptions))
        .pipe(createWriteStream(packPath))
        .on('finish', () => {
          resolve(packPath)
        })
        .on('error', (err) => {
          reject(err)
        })
    })
  }

  private async uploadPack(packPath: string, stats: PerfseeReportStats) {
    const git = await getBuildEnv().git
    if (!git?.host) {
      console.error(chalk.red('[perfsee] Did not find relative codebase host for current project.'))
      return
    }

    const artifactName =
      typeof this.options.artifactName === 'function'
        ? this.options.artifactName(stats)
        : this.options.artifactName ?? 'test'

    const params: BuildUploadParams = {
      ...git,
      projectId: this.options.project!,
      commitHash: git.commit,
      commitMessage: git.commitMessage,
      pr: git.pr,
      artifactName,
      nodeVersion: process.version,
      appVersion: this.appVersion,
      toolkit: this.options.toolkit ?? 'webpack',
    }

    console.info(chalk.green('[perfsee] start uploading build'), {
      size: PrettyBytes.stringify(statSync(packPath).size),
      params,
    })

    const query = Object.keys(params)
      .map((key) => {
        return `${key}=${params[key] ? encodeURIComponent(params[key]) : ''}`
      })
      .join('&')

    const platform = this.options.platform ?? getBuildEnv().platform

    let res: Response | undefined
    for (const tryTime of Array.from({ length: (this.options.maxRetries || 0) + 1 }, (_, i) => i)) {
      if (tryTime !== 0) {
        console.error(`[perfsee] uploading failed! ${res?.statusText}. Retrying...`)
      }
      const stream = createReadStream(packPath)
      res = await fetch(`${platform}/api/v1/artifacts?${query}`, {
        method: 'POST',
        body: stream,
        headers: {
          authorization: `Bearer ${this.options.token!}`,
          'content-type': 'application/octet-stream',
        },
      })

      if (res.ok) {
        const { url } = await res.json()

        console.info(chalk.green(`[perfsee] uploading succeed! The analyze result would be available at ${url} soon!`))
        return
      }
      await promisify(setTimeout)(this.options.retryDelay || 100)
    }
    throw new Error(`[perfsee] uploading failed! ${res?.statusText}. Response: ${await res?.text()}`)
  }

  /**
   * find the topest level of all the assets
   */
  private getRealOutputPath(outputPath: string, stats: PerfseeReportStats) {
    // may put asset outsize output path
    const maxParentAccess = stats.assets?.reduce((max, asset) => {
      // normal assets
      if (!asset.name.startsWith('..')) {
        return max
      }

      return Math.max(asset.name.split(/[\\/]/).filter((part) => part === '..').length, max)
    }, 0)

    return maxParentAccess ? join(outputPath, '../'.repeat(maxParentAccess)) : outputPath
  }
}
