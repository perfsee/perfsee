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

import { reduce } from 'lodash'

import { MetricType, LighthouseScoreMetric } from '@perfsee/shared'

export const MetricKeys = new Set([
  MetricType.FCP,
  MetricType.LCP,
  MetricType.FMP,
  MetricType.TBT,
  MetricType.TTI,
  MetricType.SI,
  MetricType.WS,
  LighthouseScoreMetric.Performance,
  LighthouseScoreMetric.Accessibility,
])

/**
 * Computes the arithmetic mean of a sample.
 *
 * @private
 * @param {Array} sample The sample.
 * @returns {number} The mean.
 */
export function getMean(sample: number[]) {
  return (
    reduce(
      sample,
      (sum, x) => {
        return sum + x
      },
      0,
    ) / sample.length || 0
  )
}

export const evaluate = (sample: number[]) => {
  const size = sample.length
  const mean = getMean(sample)

  const varOf = function (sum: number, x: number) {
    return sum + Math.pow(x - mean, 2)
  }

  // Compute the sample variance (estimate of the population variance).
  const variance = reduce(sample, varOf, 0) / (size - 1) || 0
  // Compute the sample standard deviation (estimate of the population standard deviation).
  const sd = Math.sqrt(variance)
  // Compute the standard error of the mean (a.k.a. the standard deviation of the sampling distribution of the sample mean).
  const sem = sd / Math.sqrt(size)
  // Compute the degrees of freedom.
  const df = size - 1
  // Compute the critical value.
  const critical = tTable[Math.round(df) || 1] || tTable.infinity
  // Compute the margin of error.
  const moe = sem * critical
  // Compute the relative margin of error.
  const rme = (moe / mean) * 100 || 0

  return {
    deviation: sd,
    mean: mean,
    moe: moe,
    rme: rme,
    sem: sem,
    variance: variance,
  }
}

/**
 * T-Distribution two-tailed critical values for 95% confidence.
 * For more info see http://www.itl.nist.gov/div898/handbook/eda/section3/eda3672.htm.
 */

export const tTable = {
  '1': 12.706,
  '2': 4.303,
  '3': 3.182,
  '4': 2.776,
  '5': 2.571,
  '6': 2.447,
  '7': 2.365,
  '8': 2.306,
  '9': 2.262,
  '10': 2.228,
  '11': 2.201,
  '12': 2.179,
  '13': 2.16,
  '14': 2.145,
  '15': 2.131,
  '16': 2.12,
  '17': 2.11,
  '18': 2.101,
  '19': 2.093,
  '20': 2.086,
  '21': 2.08,
  '22': 2.074,
  '23': 2.069,
  '24': 2.064,
  '25': 2.06,
  '26': 2.056,
  '27': 2.052,
  '28': 2.048,
  '29': 2.045,
  '30': 2.042,
  infinity: 1.96,
}
