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

import { trimModuleName } from '../../../module'
import { Asset, Audit, BundleAuditScore } from '../../types'

function parseNonEsmContent(asset: Asset) {
  const nonEsmContent: string[] = []
  asset.modules.forEach((m) => {
    if (m.ignored || !m.realPath) {
      return
    }

    const path = trimModuleName(m.realPath)

    if (m.esm === false && !path.match(/(react|scheduler)/)) {
      nonEsmContent.push(path)
    }
  })

  return nonEsmContent
}

export const avoidNonEsmContent: Audit = ({ assets }) => {
  const assetsWithNonEsmContent: [Asset, string[]][] = []
  assets.forEach((asset) => {
    const nonEsmContents = parseNonEsmContent(asset)
    if (nonEsmContents.length) {
      assetsWithNonEsmContent.push([asset, nonEsmContents])
    }
  })

  return {
    id: 'avoid-non-esm',
    title: 'Avoid non-esm content',
    desc: `Listed files are consist of codes that are not ECMAScript modules, which may prevent the bundler from optimizing your bundle. Please check whether these codes can be replaced with ES format.`,
    detail: {
      type: 'table',
      headings: [
        { key: 'name', itemType: 'text', name: 'Name' },
        { key: 'modules', itemType: 'list', name: 'Modules' },
      ],
      items: assetsWithNonEsmContent.map(([asset, modules]) => ({
        name: asset.name,
        modules: modules.length > 20 ? modules.slice(0, 20).concat(`and ${modules.length - 20} more...`) : modules,
        desc: `Please check whether these codes can be replaced with ES format: ${modules.slice(0, 3).join(', ')} ${
          modules.length > 3 ? `and ${modules.length - 3} more...` : ''
        }`,
      })),
    },
    link: 'https://web.dev/articles/commonjs-larger-bundles',
    score: assetsWithNonEsmContent.length <= 0 ? BundleAuditScore.Good : BundleAuditScore.Notice,
    weight: 0,
  }
}
