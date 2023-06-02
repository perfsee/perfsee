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

import { mkdirSync, rmSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'

import { extract } from 'tar'

import { PackOptions } from './types'

export async function extractBundleFromStream(stream: NodeJS.ReadableStream, path: string) {
  await new Promise((resolve, reject) => {
    rmSync(path, { recursive: true, force: true })
    mkdirSync(path, { recursive: true })
    stream
      .pipe(
        extract({
          cwd: path,
        }),
      )
      .on('finish', () => {
        resolve(path)
      })
      .on('error', (e) => {
        reject(e)
      })
  })

  const packageStatsPath = join(path, 'package-stats.json')
  const benchmarkOutDir = join(path, 'benchmark')
  const benchmarkResultPath = join(path, 'benchmark.json')
  const options: PackOptions = JSON.parse(await readFile(join(path, 'options.json'), 'utf-8'))

  return {
    packageStatsPath,
    benchmarkOutDir,
    benchmarkResultPath,
    options,
  }
}
