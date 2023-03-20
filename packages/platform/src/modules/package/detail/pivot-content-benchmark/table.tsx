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

import { SelectionMode, Stack } from '@fluentui/react'
import { useMemo } from 'react'

import {
  HeaderWithVerticalLineStyles,
  onRenderVerticalLineRow,
  Table,
  TableColumnProps,
  TableProps,
} from '@perfsee/components'
import { BenchmarkSummary as Summary } from '@perfsee/shared'

import { BenchmarkName } from './style'

const flattenResults = (summary: Summary) => {
  return summary.results.map((result) => ({
    name: result.name || summary.name,
    ops: result.ops,
    margin: result.margin,
    percentSlower: result.percentSlower,
    samples: result.samples,
    promise: result.promise.toString(),
    min: result.details.min,
    max: result.details.max,
    mean: result.details.mean,
    median: result.details.median,
    standardDeviation: result.details.standardDeviation,
    marginOfError: result.details.marginOfError,
    relativeMarginOfError: result.details.relativeMarginOfError,
    standardErrorOfMean: result.details.standardErrorOfMean,
    sampleVariance: result.details.sampleVariance,
    suiteName: summary.name,
  }))
}

type Item = ReturnType<typeof flattenResults> extends Array<infer R> ? R : never

export interface BenchmarkTableProps {
  summary: Summary
  onRowClick?: TableProps<Item>['onRowClick']
}

export const BenchmarkTable = ({ summary, onRowClick }: BenchmarkTableProps) => {
  const results = flattenResults(summary)

  const tableColumns = useMemo(() => {
    const columns = [
      {
        key: 'name',
        name: 'name',
        minWidth: 150,
        maxWidth: 350,
        sorter: (a, b) => a.name.localeCompare(b.name),
        onRender: (item) => {
          const count = item.samples

          return (
            <>
              <b>{item.name}</b>
              <span>({count} samples)</span>
            </>
          )
        },
      },
      {
        key: 'promise',
        name: 'async',
        minWidth: 60,
        maxWidth: 100,
        sorter: (a, b) => (a.promise as any) - (b.promise as any),
        onRender: (item) => item.promise.toString(),
      },
      {
        key: 'percentSlower',
        name: 'slower',
        minWidth: 60,
        maxWidth: 120,
        sorter: (a, b) => a['percentSlower'] - b['percentSlower'],
        onRender: (item) => item['percentSlower'] + '%',
      },
      {
        key: 'ops',
        name: 'ops/s',
        minWidth: 120,
        maxWidth: 180,
        sorter: (a, b) => a.ops - b.ops,
        onRender: (item) => {
          return `${item.ops} (±${item.margin}%)`
        },
      },
      ...(['min', 'max', 'mean', 'median'].map((key) => ({
        key,
        name: key,
        minWidth: 120,
        maxWidth: 180,
        sorter: (a, b) => a[key] - b[key],
        onRender: (item) => {
          return `${(item[key] * 1000).toPrecision(4)}ms`
        },
      })) as TableColumnProps<Item>[]),
      ...(['standardDeviation', 'marginOfError'].map((key) => ({
        key,
        name: key,
        minWidth: 150,
        maxWidth: 200,
        sorter: (a, b) => a[key] - b[key],
        onRender: (item) => `\xb1${(item[key] * 100).toPrecision(4)}％`,
      })) as TableColumnProps<Item>[]),
    ] as TableColumnProps<Item>[]

    if (results.length === 1) {
      columns.splice(2, 1)
    }

    return columns
  }, [results])

  return (
    <Stack>
      <BenchmarkName>{summary.name}</BenchmarkName>
      <Table
        columns={tableColumns}
        items={results}
        selectionMode={SelectionMode.none}
        onRenderRow={onRenderVerticalLineRow}
        detailsListStyles={HeaderWithVerticalLineStyles}
        onRowClick={onRowClick}
      />
    </Stack>
  )
}
