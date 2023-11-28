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

import { SOURCE_CODE_PATH } from '../../../stats'
import { Asset, Audit } from '../../types'
import { rangeScore } from '../utils'

function isMixedAsset(asset: Asset) {
  let sourceCodeExists = false
  let libsExist = false
  asset.modules.forEach((m) => {
    // in some circumstances, a module may have no path. e.g. `vite/dynamic-import-helper`
    // usually those codes are injected by bundlers or plugins.
    if (m.ignored || !m.path) {
      return
    }

    const isSourceCode = m.path === SOURCE_CODE_PATH
    sourceCodeExists = sourceCodeExists || m.path === SOURCE_CODE_PATH

    const concatenatingModules = m.concatenating.filter(
      (concatenated) => concatenated.path !== m.path && !concatenated.ignored,
    )
    libsExist = libsExist || !isSourceCode || (isSourceCode && concatenatingModules.length !== 0)
  })

  return sourceCodeExists && libsExist
}

export const mixedJs: Audit = ({ assets }) => {
  const mixedAssets: Asset[] = []
  assets.forEach((asset) => {
    if (isMixedAsset(asset)) {
      mixedAssets.push(asset)
    }
  })

  return {
    id: 'mix-content-assets',
    title: 'Separate mixed content assets files',
    desc: `Listed files are consist of both source code and third party libraries.
For most scenarios, they are in different updating lifecycle, which means putting them in same chunk(asset) will lead to high cache invalidation.
Separate them to achieve better long term predictable cache.`,
    link: 'https://developers.google.com/web/fundamentals/performance/webpack/use-long-term-caching',
    detail: {
      type: 'list',
      items: mixedAssets.map((asset) => asset.name),
    },
    score: rangeScore(mixedAssets.length, 0, 3),
    numericScore: {
      value: 1 / Math.log2(mixedAssets.length + 2),
      absoluteWarningThrottle: 0.5,
      relativeWarningThrottle: 0,
    },
    weight: 20,
  }
}
