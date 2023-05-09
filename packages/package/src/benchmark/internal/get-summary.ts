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

import { Summary } from './common-types'
import getCaseResult from './get-case-result'

type GetSummary = (event: Event) => Summary

const roundNumbersToDistinctValues = (numbers: number[], precision = 0): number[] => {
  const rounded = numbers.map((num) => {
    return Math.round(num * 10 ** precision) / 10 ** precision
  })

  const originalSizeWithoutDuplicates = new Set(numbers).size
  const roundedSizeWithoutDuplicates = new Set(rounded).size

  return roundedSizeWithoutDuplicates === originalSizeWithoutDuplicates
    ? rounded
    : roundNumbersToDistinctValues(numbers, precision + 1)
}

const getSummary: GetSummary = (event) => {
  const currentTarget = event.currentTarget

  const resultsWithoutRoundedOps = Object.entries(currentTarget)
    .filter(([key]) => !Number.isNaN(Number(key)))
    .map(([_, target]) => getCaseResult(target))

  const roundedOps = roundNumbersToDistinctValues(resultsWithoutRoundedOps.map((result) => result.ops))
  const results = resultsWithoutRoundedOps.map((result, index) => ({
    ...result,
    ops: roundedOps[index],
  }))

  const fastestIndex = results.reduce(
    (prev, next, index) => {
      return next.ops > prev.ops ? { ops: next.ops, index } : prev
    },
    { ops: 0, index: 0 },
  ).index

  const slowestIndex = results.reduce(
    (prev, next, index) => {
      return next.ops < prev.ops ? { ops: next.ops, index } : prev
    },
    { ops: Infinity, index: 0 },
  ).index

  const resultsWithDiffs = results.map((result, index) => {
    const percentSlower =
      index === fastestIndex ? 0 : Number(((1 - result.ops / results[fastestIndex].ops) * 100).toFixed(2))

    return { ...result, percentSlower }
  })

  return {
    // @ts-expect-error
    name: event.currentTarget.name,
    date: new Date(event.timeStamp),
    results: resultsWithDiffs,
    fastest: {
      name: results[fastestIndex].name,
      index: fastestIndex,
    },
    slowest: {
      name: results[slowestIndex].name,
      index: slowestIndex,
    },
  }
}

export default getSummary
