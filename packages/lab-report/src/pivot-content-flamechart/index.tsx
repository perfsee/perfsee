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

import { Panel, LayerHost } from '@fluentui/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useQueryString } from '@perfsee/components'
import { Timing } from '@perfsee/flamechart'

import { FlamechartPlaceholder } from '../flamechart'
import { SnapshotDetailType } from '../snapshot-type'

import { FlamechartOperationContext } from './context'
import { FlamechartView } from './flamechart'
import { renderMetricInsight } from './metrics-insight'
import { FlamechartContainer } from './style'

type Props = {
  snapshot: SnapshotDetailType
}

const panelLayerProps = { hostId: 'layer-host' }

export const FlameChartPivotContent = (props: Props) => {
  const { snapshot } = props
  const [queryString, updateQueryString] = useQueryString<{ insight?: string }>()
  const [clickedMetric, setClickedMetric] = useState<string | null>(queryString.insight ?? null)
  const [focusedFrame, setFocusedFrame] = useState<{ key: string; parentKeys?: string[] } | undefined>()

  const onClickTiming = useCallback(
    (click: { timing: Timing } | null) => {
      setClickedMetric(click?.timing.name ?? null)
    },
    [setClickedMetric],
  )

  const onTimingPanelDismiss = useCallback(() => {
    setClickedMetric(null)
    updateQueryString({
      ...queryString,
      insight: undefined,
    })
  }, [queryString, updateQueryString])

  const { title: metricInsightTitle, content: metricInsightContent } =
    renderMetricInsight(clickedMetric, snapshot) ?? {}

  const flamechartOperations = useMemo(() => {
    return {
      focuseFrame(key: string, parentKeys?: string[]) {
        setFocusedFrame({
          key,
          parentKeys,
        })
      },
    }
  }, [])

  useEffect(() => {
    const handler = () => {
      onTimingPanelDismiss()
    }
    document.addEventListener('fullscreenchange', handler)

    return () => document.removeEventListener('fullscreenchange', handler)
  }, [onTimingPanelDismiss])

  const metricInsightPanel = (
    <Panel
      isLightDismiss
      isOpen={!!clickedMetric && !!metricInsightContent}
      onDismiss={onTimingPanelDismiss}
      headerText={metricInsightTitle}
      isBlocking={false}
      type={3}
      layerProps={document.fullscreenElement?.id === 'full-screen-elem' ? panelLayerProps : undefined}
      styles={{ root: { zIndex: 100 } }}
    >
      <FlamechartOperationContext.Provider value={flamechartOperations}>
        {metricInsightContent}
      </FlamechartOperationContext.Provider>
    </Panel>
  )

  if ('flameChartLink' in snapshot.report && snapshot.report.flameChartLink) {
    const tasksBaseTimestamp =
      snapshot.traceData && snapshot.traceData.length > 0
        ? snapshot.traceData[0].event.ts - snapshot.traceData[0].startTime * 1000
        : undefined
    return (
      <FlamechartContainer id="full-screen-elem">
        <LayerHost id={panelLayerProps.hostId} />
        <FlamechartView
          flameChartLink={snapshot.report.flameChartLink}
          requests={snapshot.requests || []}
          requestsBaseTimestamp={snapshot.requestsBaseTimestamp}
          tasks={snapshot.traceData}
          tasksBaseTimestamp={tasksBaseTimestamp}
          metrics={snapshot.metricScores}
          userTimings={snapshot.userTimings}
          reactProfileLink={snapshot.report.reactProfileLink}
          onClickTiming={onClickTiming}
          focusedFrame={focusedFrame}
        />
        {metricInsightPanel}
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
