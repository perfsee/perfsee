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

import { Separator, Stack } from '@fluentui/react'
import { FC, useMemo } from 'react'

import { IconWithTips } from '@perfsee/components'

import { SnapshotDetailType, SnapshotReportSchema } from '../../../snapshot-type'
import { ExecutionChart } from '../../chart'
import { getChartEndTime } from '../../chart/helper'

import { ConnectionByDomainTable, TimingByResourceKindTable, OptimizationTable } from './breakdown-tables'
import { HeaderTitle } from './style'

type Props = {
  snapshots: SnapshotDetailType[]
}

export const MultiContentBreakdown: FC<Props> = (props) => {
  const { snapshots } = props

  const endTime = useMemo(() => {
    return snapshots.reduce((p, c) => {
      const endTime = getChartEndTime(c.traceData, c.timings)
      return Math.max(endTime, p)
    }, 0)
  }, [snapshots])

  return (
    <Stack tokens={{ childrenGap: 10, padding: '8px' }}>
      <HeaderTitle>
        Main Thread Processing Breakdown
        <IconWithTips marginLeft="4px" content="Blocking tasks that took more than 50ms to execute during page load." />
      </HeaderTitle>
      {snapshots.map((snapshot, i) => {
        const report = snapshot.report as NonNullable<SnapshotReportSchema>
        const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`
        return (
          <div key={snapshot.report.id}>
            <b>
              {i + 1}. {report.page.name} - {title}
            </b>
            <ExecutionChart
              hideTitle={true}
              defaultEndTime={endTime}
              tasks={snapshot.traceData}
              timings={snapshot.timings}
            />
          </div>
        )
      })}
      <Separator />
      <TimingByResourceKindTable snapshots={snapshots} />
      <Separator />
      <OptimizationTable snapshots={snapshots} />
      <Separator />
      <HeaderTitle>Connection Group By Domain</HeaderTitle>
      {snapshots.map((snapshot, i) => {
        const report = snapshot.report as NonNullable<SnapshotReportSchema>
        const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`
        return (
          <div key={snapshot.report.id}>
            <b>
              {i + 1}.{report.page.name} - {title}
            </b>
            <ConnectionByDomainTable requests={snapshot.requests || []} />
          </div>
        )
      })}
    </Stack>
  )
}
