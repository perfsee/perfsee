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

import { Spinner, SpinnerSize, Stack } from '@fluentui/react'
import { ArrowUpRightIcon } from '@fluentui/react-icons-mdl2'
import { PropsWithChildren, ReactNode, useMemo } from 'react'

import { useWideScreen } from '@perfsee/components'
import { ChartHeader } from '@perfsee/components/chart'

import { ExecutionTimeline } from '../chart'
import { useQueryString } from '../context'
import { AssetTransferred } from '../pivot-content-asset/asset-transferred'
import { AnalysisReportContent } from '../pivot-content-performance'
import { AnalysisReportTabType, SnapshotDetailType } from '../snapshot-type'

import { LHScore, ScoreCircle } from './lh-score'
import {
  LHScoreBlockContainer,
  LHScoreBlockContainerWithRelevantAudits,
  LighthouseScoreBlock,
} from './lighthouse-score-block'
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
  PivotOverviewContainer,
} from './style'
import { getCategoryAcorms, isLHCalculator } from './util'

interface Props {
  snapshot: SnapshotDetailType
  goToAssets?: () => void
  goToFlamechart?: () => void
}

export const OverviewContent = (props: Props) => {
  const { traceData, timings, metricScores, timelines, categories, requests } = props.snapshot
  const { goToAssets, goToFlamechart } = props
  const report = 'report' in props.snapshot ? props.snapshot.report : null
  const [queryString, updateQueryString] = useQueryString<{
    category?: string
    relevant?: string
  }>()
  const { category = AnalysisReportTabType.Performance } = queryString
  const auditIdToAcorms = useMemo(() => {
    return getCategoryAcorms(categories)
  }, [categories])

  const [scores, otherScores] = useMemo(() => {
    if (!metricScores) {
      return [[], []]
    }
    const scores = []
    const others = []
    for (const detail of metricScores) {
      if (isLHCalculator(detail.id, categories?.performance)) {
        const ScoreComponent = auditIdToAcorms[detail.id]
          ? LHScoreBlockContainerWithRelevantAudits
          : LHScoreBlockContainer
        scores.push(
          <ScoreComponent
            key={detail.id}
            // eslint-disable-next-line
            onClick={() => {
              auditIdToAcorms[detail.id] && updateQueryString({ ...queryString, relevant: auditIdToAcorms[detail.id] })
            }}
          >
            <LighthouseScoreBlock detail={detail} colorful={true} />
            <Stack styles={{ root: { position: 'absolute', right: 12, bottom: 20 } }}>
              <ScoreCircle score={detail.score} size={28} fontSize={14} />
            </Stack>
          </ScoreComponent>,
        )
      } else {
        others.push(<LighthouseScoreBlock key={detail.id} detail={detail} />)
      }
    }
    return [scores, others]
  }, [metricScores, categories, updateQueryString, queryString, auditIdToAcorms])

  return (
    <Stack tokens={{ childrenGap: '24px' }}>
      <OverviewMainBlockContainer horizontal horizontalAlign="space-around" verticalAlign="center">
        <OverviewMainBlock style={{ flex: '1 1 500px' }}>
          <LHScore category={categories?.[category] ?? ({} as LH.Result.Category)} />
        </OverviewMainBlock>
        <OverviewMainBlockSeparator />
        <OverviewMainBlock verticalAlign="center" style={{ padding: '12px 24px' }}>
          <SnapshotVideo video={report?.screencastStorageKey ?? undefined} cover={timelines?.slice(-1)?.[0]?.data} />
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

        {traceData ? (
          <OverviewZone
            title={
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
                <ChartHeader
                  title="Main thread execution timeline"
                  desc="Blocking tasks that took more than 50ms to execute during page load."
                />
                <Stack verticalAlign="center">
                  {goToFlamechart ? (
                    <OperationButton onClick={goToFlamechart}>
                      View in flamechart <ArrowUpRightIcon />
                    </OperationButton>
                  ) : null}
                </Stack>
              </Stack>
            }
            bordered={false}
          >
            <ExecutionTimeline tasks={traceData} timings={timings} />
          </OverviewZone>
        ) : (
          <Spinner size={SpinnerSize.medium} />
        )}

        {requests ? (
          <OverviewZone
            title={
              <Stack horizontal horizontalAlign="space-between">
                <RenderTimelineHead>
                  <b>Assets transferred by type</b>
                </RenderTimelineHead>
                <Stack verticalAlign="center">
                  {goToAssets ? (
                    <OperationButton onClick={goToAssets}>
                      View in assets <ArrowUpRightIcon />
                    </OperationButton>
                  ) : null}
                </Stack>
              </Stack>
            }
            bordered={false}
          >
            <Stack grow={1}>
              <AssetTransferred requests={requests} title="" />
            </Stack>
          </OverviewZone>
        ) : (
          <Spinner size={SpinnerSize.medium} />
        )}
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
    <PivotOverviewContainer>
      <PivotOverviewPartition>
        <OverviewContent {...props} />
      </PivotOverviewPartition>
      <PivotReportPartition>
        <AnalysisReportContent {...props} />
      </PivotReportPartition>
    </PivotOverviewContainer>
  )
}
