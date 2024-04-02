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

type KeyAuditName = 'first-contentful-paint' | 'interactive' | 'total-blocking-time' | 'largest-contentful-paint'

export const getNumericValue = (lhr: LH.Result, auditName: KeyAuditName) => lhr.audits[auditName]?.numericValue ?? NaN
export const getTTI = (lhr: LH.Result) => getNumericValue(lhr, 'interactive')

export const getScore = (lhr: LH.Result, auditName: KeyAuditName) => lhr.audits[auditName]?.score ?? NaN
export const getTBTScore = (lhr: LH.Result) => getScore(lhr, 'total-blocking-time')
export const getLCPScore = (lhr: LH.Result) => getScore(lhr, 'largest-contentful-paint')
export const getPerformance = (lhr: LH.Result) => lhr.categories['performance']?.score ?? NaN

export type MetricsRecord = {
  index: number
  lcp: number
  tbt: number
  performance: number
  benchmarkIndex: number
  cpuSlowdownMultiplier?: number
}

export function getMedianValue(numbers: number[]) {
  const sorted = numbers.slice().sort((a, b) => a - b)
  if (sorted.length % 2 === 1) return sorted[(sorted.length - 1) / 2]
  const lowerValue = sorted[sorted.length / 2 - 1]
  const upperValue = sorted[sorted.length / 2]
  return (lowerValue + upperValue) / 2
}

export function getMeanValue(numbers: number[]) {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length
}

function getMedianSortValue(value: number, median: number) {
  const distance = median - value
  return distance * distance
}

function filterToValidRuns<T extends { index: number; [key: string]: number }>(runs: T[], key: keyof T) {
  return runs.filter((run) => Number.isFinite(run[key]))
}

export function computeMedianRun<T extends { index: number; [key: string]: number }>(
  runs: T[],
  primaryKey: keyof T,
  secondaryKey: keyof T,
) {
  const runsWithPrimary = filterToValidRuns(runs, primaryKey)

  if (!runsWithPrimary.length) {
    return runs[0].index
  }

  const runsWithSecondary = filterToValidRuns(runsWithPrimary, secondaryKey)
  if (runsWithSecondary.length > 0 && runsWithSecondary.length < 3) {
    return runsWithSecondary[0].index
  }

  const medianPrimary = getMedianValue(runsWithPrimary.map((run) => run[primaryKey]))
  const medianSecondary = getMedianValue(runsWithSecondary.map((run) => run[secondaryKey]))

  // Sort by proximity to the medians, breaking ties with the secondary.
  const sortedByProximityToMedian = runsWithPrimary.sort((a, b) => {
    const aPrimary = a[primaryKey]
    const aSecondary = a[secondaryKey]
    const bPrimary = b[primaryKey]
    const bSecondary = b[secondaryKey]
    const order = getMedianSortValue(aPrimary, medianPrimary) - getMedianSortValue(bPrimary, medianPrimary)

    if (!order && aSecondary && bSecondary) {
      return getMedianSortValue(aSecondary, medianSecondary) - getMedianSortValue(bSecondary, medianSecondary)
    }

    return order
  })

  return sortedByProximityToMedian[0].index
}
