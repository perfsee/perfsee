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

import { readFileSync } from 'fs'
import { Readable } from 'stream'
import { createBrotliCompress, createGzip, constants as zlibConstants } from 'zlib'

import { Parser } from 'htmlparser2'

import { Logger } from './stats-parser/types'
import { Size, AssetTypeEnum } from './types'

export function readJSONFile<T = any>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

export function detectFileType(name: string): AssetTypeEnum {
  const regexps: { [k in AssetTypeEnum]?: RegExp } = {
    [AssetTypeEnum.Js]: /\.m?js$/i,
    [AssetTypeEnum.Css]: /\.css$/i,
    [AssetTypeEnum.Html]: /\.html?$/i,
    [AssetTypeEnum.Image]: /\.(jpe?g|png|svg|gif|webp|heif|bmp)$/i,
    [AssetTypeEnum.Font]: /\.(otf|ttf|eot|woff2?)$/i,
    [AssetTypeEnum.Media]: /\.(mp4|webm|mkv|flv|avi|wmv)$/i,
  }
  for (const [type, regexp] of Object.entries(regexps)) {
    if (regexp?.test(name)) {
      return type as AssetTypeEnum
    }
  }

  return AssetTypeEnum.Other
}

export async function calcStringCompressedSize(str: string) {
  const size: Size = {
    raw: str.length,
    gzip: 0,
    brotli: 0,
  }

  const stream = Readable.from([str])
  const [gzip, brotli] = await Promise.all([calcGzippedSize(stream), calcBrorliedSize(stream)])
  size.gzip = gzip
  size.brotli = brotli

  return size
}

export async function calcGzippedSize(input: Readable) {
  return new Promise<number>((resolve) => {
    const chunks: Buffer[] = []
    const gzip = createGzip({
      level: 4,
    })

    input.pipe(gzip)
    gzip.on('data', (chunk) => {
      chunks.push(chunk)
    })
    gzip.on('end', () => {
      resolve(Buffer.concat(chunks).toString().length)
    })
    gzip.on('error', (e) => {
      console.error('Failed to calculate file gzip compressed size', e)
      resolve(0)
    })
  })
}

export async function calcBrorliedSize(input: Readable) {
  return new Promise<number>((resolve) => {
    const chunks: Buffer[] = []
    const brotli = createBrotliCompress({
      params: {
        [zlibConstants.BROTLI_PARAM_QUALITY]: 6,
      },
    })

    input.pipe(brotli)
    brotli.on('data', (chunk) => {
      chunks.push(chunk)
    })
    brotli.on('end', () => {
      resolve(Buffer.concat(chunks).toString().length)
    })
    brotli.on('error', (e) => {
      console.error('Failed to calculate file brotli compressed size', e)
      resolve(0)
    })
  })
}

export function isInitialFileType(type: AssetTypeEnum) {
  return type === AssetTypeEnum.Js || type === AssetTypeEnum.Css || type === AssetTypeEnum.Font
}

const stringContentTypes = [AssetTypeEnum.Js, AssetTypeEnum.Css, AssetTypeEnum.Html, AssetTypeEnum.Other]
export function isStringContentType(type: AssetTypeEnum) {
  return stringContentTypes.includes(type)
}

export function addSize(size1: Size, size2: Size): Size {
  return {
    raw: size1.raw + size2.raw,
    gzip: size1.gzip + size2.gzip,
    brotli: size1.brotli + size2.brotli,
  }
}

export function getDefaultSize(): Size {
  return {
    raw: 0,
    gzip: 0,
    brotli: 0,
  }
}

export function isNotNil(value: unknown): boolean {
  return value !== undefined && value !== null
}

export function mapRefs<T extends { ref: number }>(items: T[]): number[] {
  return items.map(({ ref }) => ref)
}

export function getHtmlScripts(content: string): string[] {
  const scripts: string[] = []
  const parser = new Parser({
    onopentag(tag, attrs) {
      if (tag === 'script' && attrs['src']) {
        scripts.push(attrs['src'])
      }
    },
  })

  parser.end(content)

  return scripts
}

export function getConsoleLogger(): Logger {
  // @ts-expect-error
  // eslint-disable-next-line no-console
  console.verbose = console.log

  // @ts-expect-error
  return console
}

/**
 * Returns a hash code from a string
 * @param  {String} str The string to hash.
 * @return {Number}    A 32bit integer
 */
export function hashCode(str: string) {
  let hash = 0
  for (let i = 0, len = str.length; i < len; i++) {
    const chr = str.charCodeAt(i)
    hash = (hash << 5) - hash + chr
    hash |= 0 // Convert to 32bit integer
  }
  return hash
}
