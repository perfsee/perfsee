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

import { addSize, getDefaultSize } from '../../../utils'
import { Asset, Audit, AssetTypeEnum } from '../../types'
import { rangeScore } from '../utils'

export const largeAssets: Audit = ({ assets, chunks }) => {
  const largeComposableAssets: Asset[] = []
  let composableAssetsSize = getDefaultSize()
  let largeComposableAssetsSize = getDefaultSize()

  const largeDecomposableAssets: Asset[] = []
  let decomposableAssetsSize = getDefaultSize()
  let largeDecomposableAssetsSize = getDefaultSize()

  const initialAssets = new Set(
    chunks
      .filter((chunk) => !chunk.async)
      .map((chunk) => chunk.assets.map((asset) => asset.name))
      .flat(),
  )

  assets.forEach((asset) => {
    if (asset.type === AssetTypeEnum.Css || asset.type === AssetTypeEnum.Js || asset.type === AssetTypeEnum.Html) {
      composableAssetsSize = addSize(composableAssetsSize, asset.size)
      if (asset.size.raw > /* 200KB */ 200000 && initialAssets.has(asset.name)) {
        largeComposableAssets.push(asset)
        largeComposableAssetsSize = addSize(largeComposableAssetsSize, asset.size)
      }
    } else {
      decomposableAssetsSize = addSize(decomposableAssetsSize, asset.size)
      if (asset.size.raw > /* 200KB */ 200000 && initialAssets.has(asset.name)) {
        largeDecomposableAssets.push(asset)
        largeDecomposableAssetsSize = addSize(largeDecomposableAssetsSize, asset.size)
      }
    }
  })

  return [
    {
      id: 'large-synchronous-assets',
      title: 'Split assets into smaller pieces',
      desc: 'Large synchronous assets will increase page load time. Use proper `SplitChunk` optimization configuration and lazy load non-critical code.',
      link: 'https://web.dev/reduce-javascript-payloads-with-code-splitting/',
      detail: {
        type: 'table',
        headings: [
          { key: 'name', itemType: 'text', name: 'Asset' },
          { key: 'size', itemType: 'size', name: 'Size' },
        ],
        items: largeComposableAssets.map(({ name, size }) => ({
          name,
          size,
        })),
      },
      score: rangeScore(largeComposableAssets.length, 0, assets.length / 3),
      numericScore: {
        value: 1 - (composableAssetsSize.raw ? largeComposableAssetsSize.raw / composableAssetsSize.raw : 0),
        absoluteWarningThrottle: 0.75,
        relativeWarningThrottle: 0.1,
      },
      weight: 20,
    },
    {
      id: 'large-synchronous-decomposable-assets',
      title: 'Avoid large assets with smaller candidates',
      desc: `Large synchronous assets will increase page load time.
Replace them with smaller candidates or use higher compression rate encoding format.`,
      detail: {
        type: 'table',
        headings: [
          { key: 'name', itemType: 'text', name: 'Asset' },
          { key: 'size', itemType: 'size', name: 'Size' },
          { key: 'type', itemType: 'text', name: 'Type' },
        ],
        items: largeDecomposableAssets.map(({ name, size, type }) => ({
          name,
          size,
          type,
        })),
      },
      score: rangeScore(largeDecomposableAssets.length, 0, assets.length / 3),
      numericScore: {
        value: 1 - (decomposableAssetsSize.raw ? largeDecomposableAssetsSize.raw / decomposableAssetsSize.raw : 0),
        absoluteWarningThrottle: 0.75,
        relativeWarningThrottle: 0.1,
      },
      weight: 0,
    },
  ]
}
