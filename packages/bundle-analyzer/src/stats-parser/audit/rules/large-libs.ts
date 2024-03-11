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
import { addSize, getDefaultSize } from '../../../utils'
import { Audit, Package } from '../../types'
import { rangeScore } from '../utils'

const whiteList = new Set([SOURCE_CODE_PATH, 'react-dom', 'vue', 'lodash-es', 'rxjs', 'antd'])

export const largeLibs: Audit = ({ packages, chunks }) => {
  const largePackages: Package[] = []
  let packagesSize = getDefaultSize()
  let largePackagesSize = getDefaultSize()

  const initialAssets = new Set(
    chunks
      .filter((chunk) => !chunk.async)
      .map((chunk) => chunk.assets.map((asset) => asset.ref))
      .flat(),
  )

  packages.forEach((pkg) => {
    packagesSize = addSize(packagesSize, pkg.size)
    packages
    if (
      pkg.size.raw > /* 100KB */ 100000 &&
      !whiteList.has(pkg.name) &&
      pkg.assets.some((asset) => initialAssets.has(asset.ref))
    ) {
      largePackages.push(pkg)
      largePackagesSize = addSize(largePackagesSize, pkg.size)
    }
  })

  return {
    id: 'large-libraries',
    title: 'Avoid large JavaScript libraries with smaller alternatives',
    desc: `Large JavaScript libraries can lead to poor performance.
Prefer smaller, functionally equivalent libraries to reduce your bundle size, or on-demand loading with dynamic import statement \`import('lib')\`.`,
    link: 'https://developers.google.com/web/fundamentals/performance/webpack/decrease-frontend-size#optimize_dependencies',
    detail: {
      type: 'table',
      headings: [
        { key: 'name', itemType: 'text', name: 'Name' },
        { key: 'size', itemType: 'size', name: 'Size' },
        { key: 'ref', itemType: 'trace', name: '' },
      ],
      items: largePackages.map((pkg) => ({ name: pkg.path, size: pkg.size, ref: pkg.ref })),
    },
    score: rangeScore(largePackages.length, 0, 5),
    numericScore: {
      value: 1 - (packagesSize.raw ? largePackagesSize.raw / packagesSize.raw : 0),
      absoluteWarningThrottle: 0.9,
      relativeWarningThrottle: 0.1,
    },
    weight: 10,
  }
}
