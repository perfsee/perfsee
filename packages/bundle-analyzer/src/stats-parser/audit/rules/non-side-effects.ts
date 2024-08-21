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
import { Asset, Audit, BundleAuditScore, TreeShaking } from '../../types'

function parseSideEffectModules(asset: Asset) {
  const nonEsmContent: [string, TreeShaking][] = []
  asset.modules.forEach((m) => {
    if (m.ignored || !m.realPath || !m.treeShaking) {
      return
    }

    const path = trimModuleName(m.realPath)
    if (
      (m.treeShaking.sideEffects?.length || m.treeShaking.markedSideEffects === 'implicitly') &&
      m.treeShaking.unused?.length &&
      m.esm !== false
    ) {
      nonEsmContent.push([path, m.treeShaking])
    }
  })

  return nonEsmContent
}

export const avoidSideEffects: Audit = ({ assets }) => {
  const assetsWithSideEffectsModules: [Asset, [string, TreeShaking][]][] = []
  assets.forEach((asset) => {
    const sideEffectModules = parseSideEffectModules(asset)
    if (sideEffectModules.length) {
      assetsWithSideEffectsModules.push([asset, sideEffectModules])
    }
  })

  return {
    id: 'avoid-side-effects',
    title: 'Avoid side effects',
    desc: 'Listed files are consist of codes that having side effects or implicitly marked as having side effects in package.json, which may prevent the bundler from removing dead code.',
    detail: {
      type: 'table',
      headings: [
        { key: 'name', itemType: 'text', name: 'Name' },
        { key: 'modules', itemType: 'list', name: 'Modules' },
        { key: 'sideEffects', itemType: 'sideEffects', name: '' },
      ],
      items: assetsWithSideEffectsModules.map(([asset, modules]) => ({
        name: asset.name,
        modules: modules.map(([path, treeshaking]) =>
          treeshaking.markedSideEffects
            ? `${path} (${treeshaking.unused?.length} unused) ("sideEffect" unset)`
            : `${path} (${treeshaking.unused?.length} unused)`,
        ),
        sideEffects: modules.map(([path, treeshaking]) => (treeshaking.markedSideEffects ? null : path)),
        desc: `Please check whether side effects in those modules can be avoided: ${modules
          .slice(0, 3)
          .map(([path]) => path)
          .join(', ')} ${modules.length > 3 ? `and ${modules.length - 3} more...` : ''}`,
      })),
    },
    link: 'https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free',
    score: assetsWithSideEffectsModules.length <= 0 ? BundleAuditScore.Good : BundleAuditScore.Notice,
    weight: 0,
  }
}
