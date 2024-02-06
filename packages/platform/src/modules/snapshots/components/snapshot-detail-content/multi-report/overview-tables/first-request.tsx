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
import { SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { formatMsDuration } from '@perfsee/platform/common'
import { LighthouseScoreType, RequestSchema, Timing } from '@perfsee/shared'

import { HeaderTitle } from '../style'

type Props = {
  snapshots: SnapshotDetailType[]
}

type ItemSchema = { [K in Timing | 'name' | 'ttfb' | 'index' | 'title']: K extends 'name' | 'title' ? string : number }

const nameColumns = [
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
    onRender: (item: ItemSchema) => (
      <b>
        <TooltipHost content={item.title}>{item.name}</TooltipHost>
      </b>
    ),
  },
]
const ttfbColumn = {
  key: LighthouseScoreType.TTFB,
  name: 'TTFB',
  minWidth: 100,
  maxWidth: 120,
  comparator: (a, b) => a.ttfb - b.ttfb,
  onRender: (item) => (item.ttfb ? formatMsDuration(item.ttfb, true, 2) : '-'),
} as TableColumnProps<ItemSchema>

export const OverviewFirstRequest: FC<Props> = ({ snapshots }) => {
  const timingItems = useMemo(() => {
    return snapshots.map((snapshot, i) => {
      const report = snapshot.report as NonNullable<SnapshotReportSchema>
      const ttfb = snapshot.audits[LighthouseScoreType.TTFB].numericValue ?? 0
      const timings = (snapshot.requests?.[0] as RequestSchema)?.timings ?? []
      const temp = {} as { [K in Timing]: number }
      timings.forEach(({ name, value }) => {
        temp[name] = value
      })
      return {
        index: i + 1,
        name: report.page.name,
        title: report.snapshot.title ?? `Snapshot #${report.snapshot.id}`,
        ...temp,
        ttfb,
      }
    })
  }, [snapshots])

  const columns = useMemo(() => {
    const timings = (snapshots[0].requests?.[0] as RequestSchema)?.timings ?? []
    const result = timings.map(({ name }) => {
      return {
        key: name,
        name: name,
        minWidth: 100,
        maxWidth: 120,
        comparator: (a, b) => a[name] - b[name],
        onRender: (item) => formatMsDuration(item[name], true, 2),
      } as TableColumnProps<ItemSchema>
    })
    return [...nameColumns, ...result, ttfbColumn]
  }, [snapshots])

  return (
    <>
      <HeaderTitle>First Request Connection Time</HeaderTitle>
      <Table
        items={timingItems}
        detailsListStyles={HeaderWithVerticalLineStyles}
        selectionMode={SelectionMode.none}
        columns={columns}
        onRenderRow={onRenderVerticalLineRow}
      />
    </>
  )
}
