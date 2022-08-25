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

import { Audit, AssetTypeEnum, BundleAuditScore } from '../../types'

export const missingSourceMap: Audit = ({ assets }) => {
  const missingSourceMapAssets = assets.filter(
    (asset) => asset.type === AssetTypeEnum.Js && asset.sourcemap === false && asset.size.raw >= 1024,
  )
  return {
    id: 'missing-sourcemap',
    title: 'Missing sourcemap for js assets.',
    desc: 'Missing sourcemap will not be able to use the source analysis.',
    detail: {
      type: 'table',
      headings: [{ key: 'name', itemType: 'text', name: 'Name' }],
      items: missingSourceMapAssets.map(({ name }) => ({
        name,
      })),
    },
    score: missingSourceMapAssets.length ? BundleAuditScore.Warn : BundleAuditScore.Good,
    weight: 0,
  }
}
