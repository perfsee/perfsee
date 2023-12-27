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

import { CalendarOutlined } from '@ant-design/icons'
import { ConstrainMode, SelectionMode, Stack, Text } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import dayjs from 'dayjs'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { onRenderVerticalLineRow, Table, TableColumnProps } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { ProjectInfo, useProject } from '@perfsee/platform/modules/shared'
import { MetricType } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { InfoItem, InfoRow } from '../../style'
import { ReportScore } from '../components/report-score'

import { SnapshotsChartModule, SnapshotReport } from './module'

const formatMillisecond = (v: number) => {
  const { value, unit } = formatTime(v)
  return { value, unit }
}

const lessBetterComparator = (current: number, prev: number) => current <= prev
const greaterBetterComparator = (current: number, prev: number) => current >= prev

type SnapshotMetricsSchema = SnapshotReport & {
  prev?: SnapshotMetricsSchema
  project: ProjectInfo
}

const snapshotsColumns: TableColumnProps<SnapshotMetricsSchema>[] = [
  {
    key: 'name',
    name: 'Name',
    minWidth: 220,
    maxWidth: 220,
    onRender: (data) => (
      <Stack>
        <Stack
          horizontal={true}
          verticalAlign="center"
          tokens={{
            childrenGap: 8,
          }}
        >
          <Link
            to={pathFactory.project.lab.report({
              projectId: data.project.id,
              reportId: data.id,
              tabName: 'overview',
            })}
          >
            {data.snapshot.title ?? 'Snapshot ' + data.snapshot.id}
          </Link>
        </Stack>
        <Stack
          horizontal={true}
          verticalAlign="center"
          tokens={{
            childrenGap: 8,
          }}
        >
          <CalendarOutlined />
          <span>{dayjs(data.createdAt).format('MMM D, YYYY h:mm A')}</span>
        </Stack>
      </Stack>
    ),
  },
  {
    key: 'performance',
    name: 'Performance',
    minWidth: 100,
    maxWidth: 100,
    onRender: (data) => (
      <ReportScore
        value={data.metrics['performance']}
        prev={data.prev?.metrics['performance']}
        label={'Performance'}
        comparator={greaterBetterComparator}
      />
    ),
  },
  ...['FMP', 'TTI', 'FCP', 'LCP', 'TBT'].map((key) => {
    return {
      key: key,
      name: key,
      minWidth: 100,
      maxWidth: 100,
      onRender: (data: SnapshotMetricsSchema) => (
        <ReportScore
          value={data.metrics[MetricType[key]]}
          prev={data.prev?.metrics[MetricType[key]]}
          label={key}
          comparator={lessBetterComparator}
          formatter={formatMillisecond}
        />
      ),
    }
  }),
]

export const SnapshotMetricsList = () => {
  const { reports } = useModuleState(SnapshotsChartModule)
  const project = useProject()

  const data = useMemo(() => {
    return reports?.slice().map((item, index, array) => ({
      ...item,
      project: project!,
      prev: array[index + 1] as SnapshotMetricsSchema,
    }))
  }, [project, reports])

  if (!data?.length) {
    return null
  }

  return (
    <>
      <InfoRow align="center">
        <InfoItem>
          <Text variant="small">
            <b>{data.length} snapshots found</b>
          </Text>
        </InfoItem>
      </InfoRow>
      <Table
        items={data}
        columns={snapshotsColumns}
        selectionMode={SelectionMode.none}
        onRenderRow={onRenderVerticalLineRow}
        constrainMode={ConstrainMode.unconstrained}
        detailsListStyles={{
          headerWrapper: { position: 'sticky', top: 0, zIndex: 1000 },
        }}
      />
    </>
  )
}
