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

import { FlamechartPlaceholder } from '@perfsee/platform/modules/flamechart'

import { SnapshotDetailType } from '../../../snapshot-type'

import { FlamechartView } from './flamechart'
import { FlamechartContainer } from './style'

type Props = {
  snapshot: SnapshotDetailType
}

export const FlameChartPivotContent = (props: Props) => {
  const { snapshot } = props

  if ('flameChartStorageKey' in snapshot.report && snapshot.report.flameChartStorageKey) {
    const tasksBaseTimestamp =
      snapshot.traceData && snapshot.traceData.length > 0
        ? snapshot.traceData[0].event.ts - snapshot.traceData[0].startTime * 1000
        : undefined
    return (
      <FlamechartContainer>
        <FlamechartView
          flameChartStorageKey={snapshot.report.flameChartStorageKey}
          requests={snapshot.requests}
          requestsBaseTimestamp={snapshot.requestsBaseTimestamp}
          tasks={snapshot.traceData}
          tasksBaseTimestamp={tasksBaseTimestamp}
          metrics={snapshot.metricScores}
          userTimings={snapshot.userTimings}
        />
      </FlamechartContainer>
    )
  } else {
    return (
      <FlamechartContainer>
        <FlamechartPlaceholder>No flame chart data!</FlamechartPlaceholder>
      </FlamechartContainer>
    )
  }
}
