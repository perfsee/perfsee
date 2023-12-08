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

import { Stack } from '@fluentui/react'
import { ArrowUpRightIcon } from '@fluentui/react-icons-mdl2'
import { PropsWithChildren, ReactNode, useCallback, useMemo } from 'react'
import { useHistory, useParams } from 'react-router'

import { useQueryString, useWideScreen } from '@perfsee/components'
import { ChartHeader } from '@perfsee/components/chart'
import { RouteTypes, pathFactory } from '@perfsee/shared/routes'

import { AnalysisReportTabType, SnapshotDetailType, SnapshotUserFlowDetailType } from '../../../snapshot-type'
import { isLHCalculator } from '../../../utils/is-lh-calculator'
import { ExecutionTimeline } from '../../chart'
import { AssetTransferred } from '../pivot-content-asset/asset-transferred'
import { AnalysisReportContent } from '../pivot-content-performance'

import { LHScore, ScoreCircle } from './lh-score'
import { LighthouseScoreBlock } from './lighthouse-score-block'
import { RenderTimeline } from './render-timeline'
import { SnapshotVideo } from './render-video'
import {
  OverviewZoneContent,
  OverviewZoneTitle,
  RenderTimelineHead,
  OverviewMainBlock,
  OverviewMainBlockSeparator,
  OverviewMainBlockContainer,
  PivotOverviewPartition,
  PivotReportPartition,
  LHMetricScoreContainer,
  OperationButton,
} from './style'

type Props = {
  snapshot: SnapshotDetailType | SnapshotUserFlowDetailType
}

export const OverviewContent = (props: Props) => {
  const { traceData, timings, metricScores, timelines, categories } = props.snapshot
  const report = 'report' in props.snapshot ? props.snapshot.report : null
  const { projectId, reportId } = useParams<RouteTypes['project']['lab']['report']>()
  const history = useHistory()
  const [{ category = AnalysisReportTabType.Performance }] = useQueryString<{ category?: string }>()

  const goToFlamechart = useCallback(() => {
    history.push(pathFactory.project.lab.report({ projectId, reportId, tabName: 'flamechart' }))
  }, [history, projectId, reportId])

  const goToAssets = useCallback(() => {
    history.push(pathFactory.project.lab.report({ projectId, reportId, tabName: 'asset' }))
  }, [history, projectId, reportId])

  const [scores, otherScores] = useMemo(() => {
    if (!metricScores) {
      return [[], []]
    }
    const scores = []
    const others = []
    for (const detail of metricScores) {
      if (isLHCalculator(detail.id, categories?.performance)) {
        scores.push(
          <Stack styles={{ root: { position: 'relative' } }} key={detail.id}>
            <LighthouseScoreBlock detail={detail} colorful={true} />
            <Stack styles={{ root: { position: 'absolute', right: 16, bottom: 20 } }}>
              <ScoreCircle score={detail.score} size={28} fontSize={14} />
            </Stack>
          </Stack>,
        )
      } else {
        others.push(<LighthouseScoreBlock key={detail.id} detail={detail} />)
      }
    }
    return [scores, others]
  }, [metricScores, categories])

  return (
    <Stack tokens={{ childrenGap: '24px' }}>
      <OverviewMainBlockContainer horizontal horizontalAlign="space-around" verticalAlign="center">
        <OverviewMainBlock style={{ flex: '1 1 40%' }}>
          <LHScore category={categories?.[category] ?? ({} as LH.Result.Category)} />
        </OverviewMainBlock>
        <OverviewMainBlockSeparator />
        <OverviewMainBlock verticalAlign="center" style={{ padding: '12px 24px' }}>
          <SnapshotVideo video={report?.screencastLink ?? undefined} cover={timelines?.slice(-1)?.[0].data} />
        </OverviewMainBlock>
      </OverviewMainBlockContainer>
      {!!scores.length && (
        <OverviewZone title="Performance Metrics" padding={false} bordered={false}>
          <LHMetricScoreContainer>{scores}</LHMetricScoreContainer>
        </OverviewZone>
      )}
      {!!otherScores.length && (
        <OverviewZone title="Other Metrics" padding={false}>
          {otherScores}
        </OverviewZone>
      )}

      <Stack styles={{ root: { position: 'sticky', top: 128 } }} tokens={{ childrenGap: '28px' }}>
        {!!timelines?.length && (
          <OverviewZone
            bordered={false}
            title={
              <RenderTimelineHead>
                <b>Render Timeline</b>
              </RenderTimelineHead>
            }
          >
            <RenderTimeline timelines={timelines} />
          </OverviewZone>
        )}

        {traceData && (
          <OverviewZone
            title={
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <ChartHeader
                  title="Main thread execution timeline"
                  desc="Blocking tasks that took more than 50ms to execute during page load."
                />
                <Stack verticalAlign="center">
                  <OperationButton onClick={goToFlamechart}>
                    View in flamechart <ArrowUpRightIcon />
                  </OperationButton>
                </Stack>
              </Stack>
            }
            bordered={false}
          >
            <ExecutionTimeline tasks={traceData} timings={timings} />
          </OverviewZone>
        )}

        <OverviewZone
          title={
            <Stack horizontal horizontalAlign="space-between">
              <RenderTimelineHead>
                <b>Assets transferred by type</b>
              </RenderTimelineHead>
              <Stack verticalAlign="center">
                <OperationButton onClick={goToAssets}>
                  View in assets <ArrowUpRightIcon />
                </OperationButton>
              </Stack>
            </Stack>
          }
          bordered={false}
        >
          <Stack grow={1}>
            <AssetTransferred requests={props.snapshot.requests} title="" />
          </Stack>
        </OverviewZone>
      </Stack>
    </Stack>
  )
}

const OverviewZone = ({
  title,
  children,
  bordered = true,
  padding = false,
}: PropsWithChildren<{ title?: ReactNode; bordered?: boolean; padding?: boolean }>) => {
  if (!title) {
    return (
      <OverviewZoneContent bordered={bordered} padding={padding}>
        {children}
      </OverviewZoneContent>
    )
  }

  return (
    <div>
      <OverviewZoneTitle>{title}</OverviewZoneTitle>
      <OverviewZoneContent bordered={bordered} padding={padding}>
        {children}
      </OverviewZoneContent>
    </div>
  )
}

export const OverviewPivotContent = (props: Props) => {
  useWideScreen()

  return (
    <Stack horizontal horizontalAlign="space-between">
      <PivotOverviewPartition>
        <OverviewContent {...props} />
      </PivotOverviewPartition>
      <PivotReportPartition>
        <AnalysisReportContent {...props} />
      </PivotReportPartition>
    </Stack>
  )
}
