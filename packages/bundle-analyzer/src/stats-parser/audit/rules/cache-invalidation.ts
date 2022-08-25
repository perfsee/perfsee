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
import { BundleAuditScore, BundleResult, Size } from '../../types'

// special audit
export function appendCacheInvalidation(jobResult: BundleResult, baselineJobResult: BundleResult): BundleResult {
  const baseAssetNames = new Set<string>(baselineJobResult.assets.map((asset) => asset.name))
  const newAssetsMap = new Map(jobResult.assets.map((asset) => [asset.ref, asset]))

  jobResult.entryPoints.forEach((entryPoint) => {
    const missed = entryPoint.assetRefs.reduce((size, ref) => {
      const asset = newAssetsMap.get(ref)
      if (!asset || baseAssetNames.has(asset.name)) {
        return size
      }

      return addSize(size, asset.size)
    }, getDefaultSize())
    const total = entryPoint.size as Size

    const rawRate = total.raw ? missed.raw / total.raw : 0
    const gzipRate = total.gzip ? missed.gzip / total.gzip : 0
    const brotliRate = total.brotli ? missed.brotli / total.brotli : 0

    entryPoint.audits!.push({
      id: 'cache-invalidation',
      title: 'Avoid cache wasting',
      desc: `Cache invalidation rate is up to ${Math.round(
        rawRate * 100,
      )}%. Avoid naming changing with 'content hash' if their content is not changed.
If it's caused by dependencies version bumps, it can be safely ignored.`,
      score: rawRate >= 0.8 ? BundleAuditScore.Bad : rawRate >= 0.3 ? BundleAuditScore.Warn : BundleAuditScore.Good,
      link: 'https://perfsee.com/#TODO:LINK',
      detail: {
        type: 'table',
        headings: [
          { key: 'type', name: 'Type', itemType: 'text' },
          { key: 'total', name: 'Total Size', itemType: 'size' },
          { key: 'miss', name: 'Invalidation Size', itemType: 'size' },
          { key: 'rate', name: 'Rate', itemType: 'text' },
        ],
        items: [
          { type: 'raw', total: total.raw, miss: missed.raw, rate: `${(rawRate * 100).toFixed(2)}%` },
          { type: 'gzip', total: total.gzip, miss: missed.gzip, rate: `${(gzipRate * 100).toFixed(2)}%` },
          { type: 'brotli', total: total.brotli, miss: missed.brotli, rate: `${(brotliRate * 100).toFixed(2)}%` },
        ],
      },
      numericScore: {
        value: 1 - rawRate,
        absoluteWarningThrottle: 0.75,
        relativeWarningThrottle: 0.1,
      },
      weight: 0,
    })
  })

  return jobResult
}
