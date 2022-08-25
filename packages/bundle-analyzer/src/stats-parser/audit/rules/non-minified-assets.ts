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

import { AssetTypeEnum, BundleAuditScore, Size, Audit, Asset } from '../../types'
import { computeCSSTokenLength, computeJSTokenLength } from '../utils'

const IGNORE_THRESHOLD_IN_PERCENT = 5
const IGNORE_THRESHOLD_IN_BYTES = 2048

const cachedTokenLength = new WeakMap<Asset, number>()

export const nonMinifiedAssets: (param: Parameters<Audit>[0], ignore?: RegExp) => ReturnType<Audit> = (
  { assets },
  ignore,
) => {
  const nonMinifiedMap = new Map<string, { size: Size; wastedRatio: number; wastedPercentile: number }>()

  assets.forEach((asset) => {
    if (!asset.content || asset.content.length === 0 || ignore?.test(asset.name)) {
      return
    }

    let tokenLength = asset.size.raw
    if (cachedTokenLength.has(asset)) {
      tokenLength = cachedTokenLength.get(asset)!
    } else {
      switch (asset.type) {
        case AssetTypeEnum.Css:
          tokenLength = computeCSSTokenLength(asset.content)
          break
        case AssetTypeEnum.Js:
          tokenLength = computeJSTokenLength(asset.content)
          break
        default:
          return
      }
      cachedTokenLength.set(asset, tokenLength)
    }

    const wastedRatio = 1 - tokenLength / asset.content.length
    const wastedPercentile = wastedRatio * 100
    const wastedBytesAfterGzip = wastedRatio * asset.size.gzip

    if (wastedPercentile < IGNORE_THRESHOLD_IN_PERCENT || wastedBytesAfterGzip < IGNORE_THRESHOLD_IN_BYTES) {
      return
    }

    nonMinifiedMap.set(asset.name, { size: asset.size, wastedRatio, wastedPercentile })
  })

  return {
    id: 'non-minified-assets',
    title: 'Avoid non-minified assets',
    desc: 'Minify assets in bundle phase can reduce network payload sizes and script parsing time.',
    detail: {
      type: 'table',
      headings: [
        { key: 'name', name: 'File', itemType: 'text' },
        { key: 'saving', name: 'Potential saving bytes (at most)', itemType: 'size' },
        { key: 'wastedPercentile', name: 'Wasted bytes in percent', itemType: 'text' },
      ],
      items: Array.from(nonMinifiedMap).map(([name, { size, wastedRatio, wastedPercentile }]) => ({
        name,
        wastedPercentile,
        saving: {
          raw: size.raw * wastedRatio,
          gzip: size.gzip * wastedRatio,
          brotli: size.brotli * wastedRatio,
        } as Size,
      })),
    },
    score: nonMinifiedMap.size ? BundleAuditScore.Bad : BundleAuditScore.Good,
    numericScore: {
      value: nonMinifiedMap.size ? 0 : 1,
      absoluteWarningThrottle: 1,
    },
    weight: 20,
  }
}
