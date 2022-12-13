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

import { execFileSync } from 'child_process'
import {
  createReadStream,
  createWriteStream,
  mkdirSync,
  rmSync,
  readFileSync,
  existsSync,
  statSync,
  readdirSync,
} from 'fs'
import { join, parse } from 'path'
import { pipeline } from 'stream'
import { createBrotliDecompress, createGunzip } from 'zlib'

import { decode, decodeStream } from '@eyhn/msgpack-stream'
import { extract } from 'tar'

import { PerfseeReportStats } from './stats'
import { readJSONFile } from './utils'

export function resolveStatsPath(dir: string, regexp: RegExp): string | null {
  const isValidDir = existsSync(dir) && statSync(dir).isDirectory()
  if (!isValidDir) {
    return null
  }

  for (const child of readdirSync(dir)) {
    const path = join(dir, child)
    const stats = statSync(path)
    if (stats.isFile() && regexp.test(child)) {
      return path
    } else if (stats.isDirectory()) {
      const filePath = resolveStatsPath(path, regexp)

      if (filePath) {
        return filePath
      }
    }
  }

  return null
}

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

  const statsFilePath = resolveStatsPath(path, new RegExp(`^webpack-stats-(.*)\\.mp\\.gz$`))

  if (!statsFilePath) {
    throw new Error("Can't find stats file inside artifacts file list.")
  }

  return decompressStatsFile(statsFilePath)
}

async function decompressStatsFile(path: string): Promise<string> {
  const { dir, name } = parse(path)
  const target = join(dir, name)
  // brotli compressed stats file is deprecated
  // exists only for compatibility
  if (path.endsWith('.br')) {
    await new Promise<void>((resolve, reject) => {
      const stream = pipeline(createReadStream(path), createBrotliDecompress(), createWriteStream(target), (e) => {
        if (e) {
          reject(e)
        }
      })
      stream.on('error', reject)
      stream.on('end', resolve)
      stream.on('close', resolve)
    })

    return target
  }

  // gzipped file sometimes meet invalid header error with createGunzip()
  if (path.endsWith('.gz')) {
    try {
      execFileSync('gzip', ['-d', path])
      return target
      // eslint-disable-next-line no-empty
    } catch {}

    try {
      await new Promise<void>((resolve, reject) => {
        const stream = pipeline(createReadStream(path), createGunzip(), createWriteStream(target), (e) => {
          if (e) {
            reject(e)
          }
        })
        stream.on('error', reject)
        stream.on('end', resolve)
        stream.on('close', resolve)
      })

      return target
    } catch (e) {
      throw new Error(`Failed to decompress stats file. Internal Error: ${(e as Error).message}`)
    }
  }

  return path
}

export async function readStatsFile(path: string): Promise<PerfseeReportStats> {
  if (path.endsWith('.json')) {
    return readJSONFile(path)
  } else if (path.endsWith('.mp')) {
    const stats = statSync(path)
    if (stats.size < 2 * 1024 * 1024 * 1024 /* 2GB */) {
      const buf = readFileSync(path)
      return decode(buf) as PerfseeReportStats
    } else {
      return (await decodeStream(createReadStream(path))) as PerfseeReportStats
    }
  } else {
    throw new Error('unsupported stats file encoding.')
  }
}
