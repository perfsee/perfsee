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

import {
  onRenderVerticalLineRow,
  TableColumnProps,
  Table,
  IconWithTips,
  HeaderWithVerticalLineStyles,
} from '@perfsee/components'
import { ChartHeaderTitle } from '@perfsee/components/chart/style'
import { formatMsDuration } from '@perfsee/platform/common'

import { RecordType, SnapshotDetailType, SnapshotReportSchema } from '../../../../snapshot-type'
import { getRecordTypeParams } from '../../../chart/helper'

type TimingByResourceKind = { [key: string]: number } & { name: string; title: string; total: number; index: number }

const defaultColumns = [
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
    sorter: (a, b) => a.name.localeCompare(b.name),
    onRender: (item) => (
      <TooltipHost content={item.title}>
        <b>{item.name}</b>
      </TooltipHost>
    ),
  },
  {
    key: 'total',
    name: 'Total',
    minWidth: 100,
    maxWidth: 120,
    sorter: (a, b) => a.total - b.total,
    comparator: (a, b) => a.total - b.total,
    onRender: (item) => formatMsDuration(item.total, true, 2),
  },
] as TableColumnProps<TimingByResourceKind>[]

const timingColumns = Object.keys(RecordType)
  .filter((v) => v !== RecordType.longTask)
  .map((key) => {
    return {
      key: key,
      name: getRecordTypeParams(key).text,
      minWidth: 120,
      maxWidth: 130,
      sorter: (a, b) => a[key] - b[key],
      comparator: (a, b) => a[key] - b[key],
      onRender: (item) => (item[key] ? formatMsDuration(item[key], true, 2) : '-'),
    } as TableColumnProps<TimingByResourceKind>
  })

type Props = {
  snapshots: SnapshotDetailType[]
}

export const TimingByResourceKindTable: FC<Props> = ({ snapshots }) => {
  const items = useMemo(() => {
    return snapshots.map((snapshot, i) => {
      const report = (snapshot.report ?? {}) as NonNullable<SnapshotReportSchema>

      const events = flatMap(snapshot.traceData ?? [], (item) => [item, ...item.children])
      const groups = events.reduce((p, c) => {
        p[c.kind] = (p[c.kind] ?? 0) + c.duration
        p['total'] = (p['total'] ?? 0) + c.duration
        return p
      }, {})

      const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`

      return { ...groups, name: report.page.name, index: i + 1, title } as TimingByResourceKind
    })
  }, [snapshots])

  return (
    <div>
      <ChartHeaderTitle>
        Blocking Time Group By Resource Kind
        <IconWithTips
          marginLeft="4px"
          content="Blocking time contained tasks that took more than 50ms to execute during page load."
        />
      </ChartHeaderTitle>
      <Table
        columns={[...defaultColumns, ...timingColumns]}
        detailsListStyles={HeaderWithVerticalLineStyles}
        items={items}
        selectionMode={SelectionMode.none}
        onRenderRow={onRenderVerticalLineRow}
      />
    </div>
  )
}
