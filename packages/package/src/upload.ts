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

import { createReadStream, createWriteStream, statSync } from 'fs'
import { dirname } from 'path'

import chalk from 'chalk'
import fetch from 'node-fetch'
import { create } from 'tar'

import { getBuildEnv } from '@perfsee/plugin-utils'
import { PrettyBytes } from '@perfsee/utils'

import { anaylize } from './analyze'
import { PackageUploadParams, PackageJson, PackOptions } from './types'

let appVersion = 'unknown'

try {
  appVersion = require('../package.json').version
} catch (e) {
  console.error('Read self version failed', e)
}

export const anaylizeAndPack = async (path: string, packageJson: PackageJson, options: PackOptions = {}) => {
  const { outputDir, packageStats, benchmarkResult } = await anaylize(path, packageJson, options)

  const packPath = `${outputDir}.tar`
  const resultPath = await new Promise<string>((resolve, reject) => {
    create(
      {
        cwd: outputDir,
      },
      ['./'],
    )
      .pipe(createWriteStream(packPath))
      .on('finish', () => resolve(packPath))
      .on('error', (err) => reject(err))
  })

  return {
    packPath: resultPath,
    packageStats,
    benchmarkResult,
  }
}

export const uploadPack = async (
  packPath: string,
  projectId: string,
  packageJson: Required<PackageJson>,
  platform = getBuildEnv().platform,
) => {
  const buildEnv = getBuildEnv()

  if (!buildEnv.upload) {
    console.info(
      chalk.yellow(
        `[perfsee] found no upload flag, skip uploading to platform. The results can be found in ${dirname(packPath)}`,
      ),
    )
    return
  }

  const git = await buildEnv.git

  if (!git?.host) {
    console.error(chalk.red('[perfsee] Did not find relative codebase host for current project.'))
    return
  }

  const params: PackageUploadParams = {
    ...git,
    projectId,
    commitHash: git.commit,
    commitMessage: git.commitMessage,
    pr: git.pr,
    nodeVersion: process.version,
    appVersion,
    packageName: packageJson.name,
    packageVersion: packageJson.version,
    description: packageJson.description,
    keywords: packageJson.keywords?.join(','),
  }

  const stream = createReadStream(packPath)

  console.info(chalk.green('[perfsee] start uploading package'), {
    size: PrettyBytes.stringify(statSync(packPath).size),
    params,
  })

  const query = Object.keys(params)
    .map((key) => {
      return `${key}=${params[key] ? encodeURIComponent(params[key]) : ''}`
    })
    .join('&')

  const res = await fetch(`${platform}/api/v1/packages?${query}`, {
    method: 'POST',
    body: stream,
    headers: {
      authorization: `Bearer ${process.env.PERFSEE_TOKEN!}`,
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
