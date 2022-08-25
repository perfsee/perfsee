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
import { PropsWithChildren, ReactNode, useMemo } from 'react'

import { ChartHeader } from '@perfsee/components/chart'
import { getStorageLink } from '@perfsee/platform/common'

import { SnapshotDetailType, SnapshotUserFlowDetailType } from '../../../snapshot-type'
import { isLHCalculator } from '../../../utils/is-lh-calculator'
import { ExecutionTimeline } from '../../chart'
import { AssetTransferred } from '../pivot-content-asset/asset-transferred'

import { LighthouseScoreBlock } from './lighthouse-score-block'
import { RenderTimeline } from './render-timeline'
import { SnapshotVideo } from './render-video'
import {
  OverviewZoneContent,
  OverviewZoneTitle,
  ColorScore,
  ScoreContainer,
  OverviewScoreWrap,
  RenderTimelineHead,
} from './style'
import { getCategoryCount } from './util'

type Props = {
  snapshot: SnapshotDetailType | SnapshotUserFlowDetailType
}

export const OverviewPivotContent = (props: Props) => {
  const { traceData, timings, metricScores, timelines, categories, audits } = props.snapshot
  const report = 'report' in props.snapshot ? props.snapshot.report : null

  const [scores, otherScores] = useMemo(() => {
    if (!metricScores) {
      return [[], []]
    }
    const scores = []
    const others = []
    for (const detail of metricScores) {
      if (isLHCalculator(detail.id, categories?.performance)) {
        scores.push(<LighthouseScoreBlock key={detail.id} detail={detail} colorful={true} />)
      } else {
        others.push(<LighthouseScoreBlock key={detail.id} detail={detail} />)
      }
    }
    return [scores, others]
  }, [metricScores, categories])

  return (
    <Stack tokens={{ childrenGap: '24px' }}>
      <OverviewZone padding={true}>
        <AssetTransferred chartType="donut" requests={props.snapshot.requests} />
        <OverviewScoreWrap>
          {categories &&
            Object.values(categories).map((tab) => {
              const { passed, opportunity, notApply } = getCategoryCount(audits, tab.auditRefs)
              return (
                <ScoreContainer key={tab.id}>
                  <b>{tab.title}</b>
                  <ColorScore score={tab.score} size={36}>
                    {tab.score ? Math.round(tab.score * 100) : '-'}
                  </ColorScore>
                  <p>
                    Opportunities: <b>{opportunity}</b>
                  </p>
                  <p>
                    Not applicable: <b>{notApply}</b>
                  </p>
                  <p>
                    Passed audits: <b>{passed}</b>
                  </p>
                </ScoreContainer>
              )
            })}
        </OverviewScoreWrap>
      </OverviewZone>
      {!!scores.length && (
        <OverviewZone title="Performance Metrics" padding={false}>
          {scores}
        </OverviewZone>
      )}
      {!!otherScores.length && (
        <OverviewZone title="Other Metrics" padding={false}>
          {otherScores}
        </OverviewZone>
      )}
      {!!timelines?.length && (
        <OverviewZone
          bordered={false}
          title={
            <RenderTimelineHead>
              <b>Render Timeline</b>
              {report?.screencastStorageKey && <SnapshotVideo video={getStorageLink(report.screencastStorageKey)} />}
            </RenderTimelineHead>
          }
        >
          <RenderTimeline timelines={timelines} />
        </OverviewZone>
      )}

      {traceData && (
        <OverviewZone
          title={
            <ChartHeader
              title="Main thread execution timeline"
              desc="Blocking tasks that took more than 50ms to execute during page load."
            />
          }
          bordered={false}
        >
          <ExecutionTimeline tasks={traceData} timings={timings} />
        </OverviewZone>
      )}
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
