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

import { LighthouseScoreType, MetricType } from '@perfsee/shared'

import { ArtifactEntrypoints, SnapshotRecord } from './module'

function getInitialSumSize(entryPoints?: ArtifactEntrypoints) {
  if (!entryPoints) {
    return null
  }

  return entryPoints.reduce(
    (p, c) => {
      return {
        raw: p.raw + c.initialSize.raw,
        gzip: p.gzip + c.initialSize.gzip,
        brotli: p.brotli + c.initialSize.brotli,
      }
    },
    { raw: 0, gzip: 0, brotli: 0 },
  )
}

function getBundleSumSize(entryPoints?: ArtifactEntrypoints) {
  if (!entryPoints) {
    return null
  }

  return entryPoints.reduce(
    (p, c) => {
      return {
        raw: p.raw + c.size.raw,
        gzip: p.gzip + c.size.gzip,
        brotli: p.brotli + c.size.brotli,
      }
    },
    { raw: 0, gzip: 0, brotli: 0 },
  )
}

export function getAverageInitialSize(entryPoints?: ArtifactEntrypoints) {
  const size = getInitialSumSize(entryPoints)
  const count = entryPoints?.length

  if (size && count) {
    return {
      raw: size.raw / count,
      brotli: size.brotli / count,
      gzip: size.gzip / count,
    }
  }
}

export function getAverageBundleSize(entryPoints?: ArtifactEntrypoints) {
  const size = getBundleSumSize(entryPoints)
  const count = entryPoints?.length

  if (size && count) {
    return {
      raw: size.raw / count,
      brotli: size.brotli / count,
      gzip: size.gzip / count,
    }
  }
}

export function getLabAverageMetricValue(
  metricKey: MetricType | LighthouseScoreType,
  reports?: SnapshotRecord['snapshotReports'],
) {
  if (!reports?.length) {
    return undefined
  }

  let count = 0
  const sum = reports.reduce((p, { metrics }) => {
    if (metrics[metricKey]) {
      count++
      return p + metrics[metricKey]
    }
    return p
  }, 0)

  return count && sum ? sum / count : undefined
}
