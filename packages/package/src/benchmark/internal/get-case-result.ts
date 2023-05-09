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

import type { Event } from 'benchmark'

import { CaseResult, Target } from './common-types'

type GetCaseResult = (event: Event) => CaseResult

function median(data: number[]) {
  data.sort(function comparator(n, m) {
    return n < m ? -1 : 1
  })
  if (data.length % 2 === 0) {
    return (data[data.length / 2 - 1] + data[data.length / 2]) / 2
  }
  return data[Math.floor(data.length / 2)]
}

const getCaseResult: GetCaseResult = (event) => {
  const target = (event.target || event) as Target

  return {
    name: target.name,
    ops: target.hz,
    margin: Number(target.stats.rme.toFixed(2)),
    options: {
      delay: target.delay,
      initCount: target.initCount,
      minTime: target.minTime,
      maxTime: target.maxTime,
      minSamples: target.minSamples,
    },
    samples: target.stats.sample.length,
    promise: target.defer,
    details: {
      min: Math.min(...target.stats.sample),
      max: Math.max(...target.stats.sample),
      mean: target.stats.mean,
      median: median(target.stats.sample),
      standardDeviation: target.stats.deviation,
      marginOfError: target.stats.moe,
      relativeMarginOfError: target.stats.rme,
      standardErrorOfMean: target.stats.sem,
      sampleVariance: target.stats.variance,
      sampleResults: target.stats.sample,
    },
    completed: target.stats.sample.length > 0,
  }
}

export default getCaseResult
