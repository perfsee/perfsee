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

import { SelectionMode, TooltipHost } from '@fluentui/react'
import { flatMap } from 'lodash'
import { FC, useMemo } from 'react'

import { HeaderWithVerticalLineStyles, onRenderVerticalLineRow, Table, TableColumnProps } from '@perfsee/components'
import { PrettyBytes, RequestSchema, TimingType, TraceTimesWithoutFCP } from '@perfsee/shared'

import { SnapshotDetailType, SnapshotReportSchema } from '../../../../snapshot-type'
import { HeaderTitle } from '../style'

type beforeMetric = {
  fcp: number
  fmp: number
  lcp: number
}

type SummaryType = {
  name: string
  title: string
  beforeCount: beforeMetric
  beforeSize: beforeMetric
  totalSize: number
  totalCount: number
}

const metricColumns = ['fcp', 'fmp', 'lcp'].map((key) => {
  return [
    {
      key: `before-${key}-count`,
      name: `Request before ${key.toUpperCase()}`,
      minWidth: 160,
      maxWidth: 200,
      comparator: (a, b) => {
        const aValue = a.beforeCount[key] / a.totalCount
        const bValue = b.beforeCount[key] / b.totalCount
        return bValue - aValue
      },
      onRender: (item) => (
        <span>
          {item.beforeCount[key]}/{item.totalCount}
        </span>
      ),
    },
    {
      key: `before-${key}-size`,
      name: `Size before ${key.toUpperCase()}`,
      minWidth: 150,
      maxWidth: 200,
      comparator: (a, b) => {
        return a.beforeSize[key] - b.beforeSize[key]
      },
      onRender: (item) => (
        <span>
          {PrettyBytes.stringify(item.beforeSize[key])}({((item.beforeSize[key] / item.totalSize) * 100).toFixed(2)}%)
        </span>
      ),
    },
  ] as TableColumnProps<SummaryType>[]
})

const columns = [
  {
    key: 'index',
    name: '#',
    fieldName: 'index',
    minWidth: 10,
    maxWidth: 20,
  },
  {
    key: 'name',
    name: 'Name',
    minWidth: 100,
    maxWidth: 160,
    onRender: (item: SummaryType) => (
      <TooltipHost content={item.title}>
        <b>{item.name}</b>
      </TooltipHost>
    ),
  },
  ...flatMap(metricColumns),
]

type Props = {
  snapshots: SnapshotDetailType[]
}

export const OverviewRequestSummary: FC<Props> = ({ snapshots }) => {
  const items: SummaryType[] = useMemo(() => {
    return snapshots.map((snapshot, i) => {
      const metricTimings = (snapshot.timings ?? {}) as TraceTimesWithoutFCP
      const report = snapshot.report as NonNullable<SnapshotReportSchema>
      const fcp = metricTimings[TimingType.FCP] ?? 0
      const fmp = metricTimings[TimingType.FMP] ?? 0
      const lcp = metricTimings[TimingType.LCP] ?? 0

      const { beforeCount, beforeSize, totalSize } = snapshot.requests.reduce(
        (p, c) => {
          const req = c as RequestSchema
          if (req.startTime <= fcp) {
            p.beforeCount.fcp++
            p.beforeSize.fcp += req.size
          }
          if (req.startTime <= fmp) {
            p.beforeCount.fmp++
            p.beforeSize.fmp += req.size
          }

          if (req.startTime <= lcp) {
            p.beforeCount.lcp++
            p.beforeSize.lcp += req.size
          }
          p.totalSize += req.size
          return p
        },
        {
          beforeCount: { fcp: 0, fmp: 0, lcp: 0 },
          beforeSize: { fcp: 0, fmp: 0, lcp: 0 },
          totalSize: 0,
        },
      )

      return {
        index: i + 1,
        name: report.page.name,
        title: report.snapshot.title ?? `Snapshot #${report.snapshot.id}`,
        beforeCount,
        beforeSize,
        totalSize,
        totalCount: snapshot.requests.length,
      }
    })
  }, [snapshots])

  return (
    <>
      <HeaderTitle>Request Summary</HeaderTitle>
      <Table
        items={items}
        detailsListStyles={HeaderWithVerticalLineStyles}
        selectionMode={SelectionMode.none}
        columns={columns}
        onRenderRow={onRenderVerticalLineRow}
      />
    </>
  )
}
