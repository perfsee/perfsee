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
import { FC, useMemo } from 'react'

import { HeaderWithVerticalLineStyles, onRenderVerticalLineRow, Table, TableColumnProps } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { LighthouseScoreType, MetricScoreSchema } from '@perfsee/shared'

import { SnapshotDetailType, SnapshotReportSchema } from '../../../../snapshot-type'
import { HeaderTitle } from '../style'

type Props = {
  snapshots: SnapshotDetailType[]
}

type ItemSchema = { index: number; name: string; title: string } & Record<string, MetricScoreSchema>

const nameColumns: TableColumnProps<ItemSchema>[] = [
  {
    key: 'index',
    name: '#',
    fieldName: 'index',
    minWidth: 10,
    maxWidth: 20,
  },
  {
    key: 'name',
    name: 'Page',
    minWidth: 120,
    maxWidth: 160,
    onRender: (item: ItemSchema) => (
      <b>
        <TooltipHost content={item.title}>{item.name}</TooltipHost>
      </b>
    ),
  },
]

const renderer = (id: string) => (item: ItemSchema) => {
  const detail = item[id] as MetricScoreSchema
  if (!detail) {
    return '-'
  }

  if (detail.value && detail.formatter === 'duration') {
    const { value, unit } = formatTime(detail.value)
    return (
      <span>
        {value}
        {unit}
      </span>
    )
  }
  return typeof detail.value === 'number' ? detail.value : '-'
}

const webColumns = Object.keys(LighthouseScoreType)
  .filter((key) => {
    const id = LighthouseScoreType[key]
    return id !== LighthouseScoreType.TTFB && id !== LighthouseScoreType.VC
  })
  .map((key) => {
    const id = LighthouseScoreType[key]
    return {
      key: key,
      name: key,
      minWidth: id === LighthouseScoreType.ResponseTime || id === LighthouseScoreType.WhiteScreen ? 110 : 90,
      maxWidth: 110,
      comparator: (a, b) => (a[id]?.value ?? 0) - (b[id]?.value ?? 0),
      onRender: renderer(id),
    } as TableColumnProps<ItemSchema>
  })

export const MetricSummary: FC<Props> = ({ snapshots }) => {
  const items = useMemo(() => {
    return snapshots.map((snapshot, i) => {
      const report = snapshot.report as NonNullable<SnapshotReportSchema>

      const score = (snapshot.metricScores ?? []).reduce((p, c) => {
        return { ...p, [c.id]: c }
      }, {}) as Record<string, MetricScoreSchema>

      return {
        index: i + 1,
        name: report.page.name,
        title: report.snapshot.title ?? `Snapshot #${report.snapshot.id}`,
        ...score,
      } as ItemSchema
    })
  }, [snapshots])

  return (
    <>
      <HeaderTitle>Metric Summary</HeaderTitle>
      <Table
        items={items}
        detailsListStyles={HeaderWithVerticalLineStyles}
        selectionMode={SelectionMode.none}
        columns={nameColumns.concat(webColumns)}
        onRenderRow={onRenderVerticalLineRow}
      />
    </>
  )
}
