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

import run from 'lighthouse'
// @ts-expect-error
import defaultConfig from 'lighthouse/lighthouse-core/config/default-config'

import { NetworkRequests, WhiteScreen } from './audits'
import { ConsoleLogger, RequestInterception, Screencast } from './gatherers'

type KeyAuditName = 'first-contentful-paint' | 'interactive'

export const getNumericValue = (lhr: LH.Result, auditName: KeyAuditName) => lhr.audits[auditName]?.numericValue ?? NaN
export const getFCP = (lhr: LH.Result) => getNumericValue(lhr, 'first-contentful-paint')
export const getTTI = (lhr: LH.Result) => getNumericValue(lhr, 'interactive')

export type MetricsRecord = {
  fcp: number
  tti: number
  index: number
}

function getMedianValue(numbers: number[]) {
  const sorted = numbers.slice().sort((a, b) => a - b)
  if (sorted.length % 2 === 1) return sorted[(sorted.length - 1) / 2]
  const lowerValue = sorted[sorted.length / 2 - 1]
  const upperValue = sorted[sorted.length / 2]
  return (lowerValue + upperValue) / 2
}

function getMedianSortValue(value: number, median: number) {
  const distance = median - value
  return distance * distance
}

function filterToValidRuns(runs: MetricsRecord[], key: keyof MetricsRecord) {
  return runs.filter((run) => Number.isFinite(run[key]))
}

export function computeMedianRun(runs: MetricsRecord[]) {
  const runsWithFCP = filterToValidRuns(runs, 'fcp')

  if (!runsWithFCP.length) {
    return runs[0].index
  }

  const runsWithTTI = filterToValidRuns(runsWithFCP, 'tti')
  if (runsWithTTI.length > 0 && runsWithTTI.length < 3) {
    return runsWithTTI[0].index
  }

  const medianFCP = getMedianValue(runsWithFCP.map((run) => run.fcp))
  const medianTTI = getMedianValue(runsWithTTI.map((run) => run.tti))

  // Sort by proximity to the medians, breaking ties with the minimum TTI.
  const sortedByProximityToMedian = runsWithFCP.sort((a, b) => {
    const aFCP = a.fcp
    const aTTI = a.tti
    const bFCP = b.fcp
    const bTTI = b.tti
    const fcpOrder = getMedianSortValue(aFCP, medianFCP) - getMedianSortValue(bFCP, medianFCP)

    if (aTTI && bTTI) {
      return fcpOrder + getMedianSortValue(aTTI, medianTTI) - getMedianSortValue(bTTI, medianTTI)
    }

    return fcpOrder
  })

  return sortedByProximityToMedian[0].index
}

export async function lighthouse(url?: string, { customFlags, ...flags }: LH.Flags = {}) {
  return run(
    url,
    {
      maxWaitForFcp: 30 * 1000,
      maxWaitForLoad: 45 * 1000,
      output: 'json',
      logLevel: 'info',
      ...flags,
    },
    {
      ...defaultConfig,
      passes: defaultConfig.passes.map((pass: LH.PerfseePassJson) => {
        pass = {
          ...pass,
          gatherers: [new RequestInterception(customFlags?.headers), new ConsoleLogger(), ...(pass.gatherers ?? [])],
        }

        if (pass.passName === 'defaultPass') {
          pass.gatherers?.push(Screencast)
        }

        return pass
      }),
      audits: [...defaultConfig.audits, NetworkRequests, WhiteScreen],
      settings: {
        additionalTraceCategories: 'disabled-by-default-v8.cpu_profiler',
      },
    },
  )
}
