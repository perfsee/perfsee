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
import { ExecutionChart } from '@perfsee/lab-report/chart'
import { getChartEndTime } from '@perfsee/lab-report/chart/helper'
import { AssetTransferred } from '@perfsee/lab-report/pivot-content-asset/asset-transferred'
import { SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'

import { OptimizationTable, TimingByResourceKindTable } from './breakdown-tables'
import {
  OverviewRequestSummary,
  OverviewFirstRequest,
  OverviewRenderTimelines,
  MetricSummary,
  ComparisonPropertyTable,
} from './overview-tables'
import { HeaderTitle } from './style'

type Props = {
  snapshots: SnapshotDetailType[]
}

export const MultiContentOverview: FC<Props> = ({ snapshots }) => {
  const endTime = useMemo(() => {
    return snapshots.reduce((p, c) => {
      const endTime = getChartEndTime(c.traceData, c.timings)
      return Math.max(endTime, p)
    }, 0)
  }, [snapshots])

  return (
    <Stack tokens={{ childrenGap: 10, padding: '8px' }}>
      <ComparisonPropertyTable snapshots={snapshots} />
      <MetricSummary snapshots={snapshots} />
      <Separator />
      <OverviewRenderTimelines snapshots={snapshots} />
      <Separator />
      <OverviewFirstRequest snapshots={snapshots} />
      <Separator />
      <HeaderTitle>Asset Transferred By Type</HeaderTitle>
      {snapshots.map((snapshot) => {
        const report = snapshot.report as NonNullable<SnapshotReportSchema>
        return (
          <div key={report.id}>
            <AssetTransferred title={report.page.name} requests={snapshot.requests || []} />
          </div>
        )
      })}
      <Separator />
      <OptimizationTable snapshots={snapshots} />
      <Separator />
      <OverviewRequestSummary snapshots={snapshots} />
      <Separator />
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
    </Stack>
  )
}
