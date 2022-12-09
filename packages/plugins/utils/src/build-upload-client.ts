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
import { PassThrough, pipeline } from 'stream'
import { createGzip } from 'zlib'

import { encode, encodeStream, ExtensionCodec } from '@eyhn/msgpack-stream'
import chalk from 'chalk'
import fetch from 'node-fetch'
import { create } from 'tar'
import { v4 as uuid } from 'uuid'

import { PerfseeReportStats } from '@perfsee/bundle-analyzer'
import { PrettyBytes } from '@perfsee/utils'

import { getBuildEnv } from './build-env'
import { CommonPluginOptions } from './options'

const msgpackExtensionCodec = new ExtensionCodec()
const filteredFields = [
  'identifier',
  'issuerPath',
  'issuer',
  'moduleIdentifier',
  'parents',
  'siblings',
  'origins',
  'module',
]
msgpackExtensionCodec.register({
  type: 0,
  encode: (object: unknown) => {
    if (object instanceof Object && !(object instanceof Array)) {
      for (const field of filteredFields) {
        delete object[field]
      }
    }

    return null
  },
  decode: () => null,
})

function encodeStatsJsonStream(stats: PerfseeReportStats) {
  return encodeStream(stats, { extensionCodec: msgpackExtensionCodec })
}

function encodeStatsJson(stats: PerfseeReportStats) {
  const encoded = encode(stats, { extensionCodec: msgpackExtensionCodec })
  return Buffer.from(encoded, encoded.byteOffset, encoded.byteLength)
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
    }

    try {
      // firstly write stats json down to disk in output path.
      const statsPath = await this.writeStats(stats, !!this.options.useExperimentalStreamEncoder)

      // then pack the assets in output path
      const packPath = await this.pack(statsPath, stats)

      // then upload the pack to platform
      await this.uploadPack(packPath)

      if (!process.env.KEEP_STATS) {
        unlinkSync(statsPath)
      }
    } catch (e) {
      console.error(chalk.red('[perfsee] Failed to upload build'))
      console.error(chalk.red(String(e)))
    }
  }

  /**
   * for some huge project, the stats json may be too big to be stringified(more than 500MB, which is the MAXMUM string size of v8),
   * we choose msgpack instead of streaming json to dick so we can both save the disk size
   * and reduce the network transfer time during uploading.
   */
  private async writeStats(stats: PerfseeReportStats, stream: boolean) {
    const statsFile = join(this.outputPath, `webpack-stats-${uuid()}.mp.gz`)

    return new Promise<string>((resolve, reject) => {
      if (stream) {
        pipeline(encodeStatsJsonStream(stats), createGzip(), createWriteStream(statsFile), (err) => {
          if (err) {
            reject(err)
          } else {
            resolve(statsFile)
          }
        })
      } else {
        const source$ = new PassThrough()
        pipeline(source$, createGzip(), createWriteStream(statsFile), (err) => {
          if (err) {
            reject(err)
          } else {
            resolve(statsFile)
          }
        })

        source$.end(encodeStatsJson(stats))
      }
    })
  }

  private async pack(statsPath: string, stats: PerfseeReportStats) {
    return new Promise<string>((resolve, reject) => {
      const packPath = `${tmpdir()}/build-${uuid()}.tar`
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
        .pipe(createWriteStream(packPath))
        .on('finish', () => {
          resolve(packPath)
        })
        .on('error', (err) => {
          reject(err)
        })
    })
  }

  private async uploadPack(packPath: string) {
    const git = await getBuildEnv().git
    if (!git?.host) {
      console.error(chalk.red('[perfsee] Did not find relative codebase host for current project.'))
      return
    }

    const params: BuildUploadParams = {
      ...git,
      projectId: this.options.project!,
      commitHash: git.commit,
      commitMessage: git.commitMessage,
      artifactName: this.options.artifactName ?? 'test',
      nodeVersion: process.version,
      appVersion: this.appVersion,
      toolkit: this.options.toolkit ?? 'webpack',
    }

    const stream = createReadStream(packPath)

    console.info(chalk.green('[perfsee] start uploading build'), {
      size: PrettyBytes.stringify(statSync(packPath).size),
      params,
    })

    const query = Object.keys(params)
      .map((key) => {
        return `${key}=${params[key] ? encodeURIComponent(params[key]) : ''}`
      })
      .join('&')

    const res = await fetch(`${getBuildEnv().platform}/api/v1/artifacts?${query}`, {
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
    } else {
      throw new Error(`[perfsee] uploading failed! ${res.statusText}. Response: ${await res.text()}`)
    }
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
