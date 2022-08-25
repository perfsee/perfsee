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

import { FC, memo, useMemo } from 'react'

import { SnapshotStatus } from '@perfsee/schema'

import { ScoreWarnings } from './score-warnings'
import {
  PerformanceScoreContent,
  PerformanceScoreHeader,
  PerformanceScoreWrap,
  ScoreWrap,
  StyledLink,
  VersionDetailItem,
  VersionDetailItemHeader,
} from './styled'
import { getScoreColors } from './utils'

type Props = {
  reportLink: string
  performanceScore: number | null
  status: SnapshotStatus
  sourceIssueCount: number
  hash: string
  reportId: number
}

export const PerformanceScore: FC<Props> = ({
  reportLink,
  performanceScore,
  status,
  sourceIssueCount,
  hash,
  reportId,
}) => {
  return (
    <VersionDetailItem>
      <VersionDetailItemHeader>
        <span>Performance</span>
        <StyledLink to={reportLink}>Detail</StyledLink>
      </VersionDetailItemHeader>
      <ScoreWrap>
        <Score score={performanceScore ?? 0} status={status} />
        <ScoreWarnings reportId={reportId} hash={hash} sourceIssueCount={sourceIssueCount} />
      </ScoreWrap>
    </VersionDetailItem>
  )
}

type ScoreProps = {
  score: number
  status: SnapshotStatus
}

export const Score: FC<ScoreProps> = memo(({ score, status }) => {
  const { backgroundColor, headColor, textColor } = getScoreColors(score)

  const realText = useMemo(() => {
    if (typeof score !== 'number' || score === 0 || status !== SnapshotStatus.Completed) {
      return 'None'
    }

    return score
  }, [score, status])

  return (
    <PerformanceScoreWrap color={backgroundColor}>
      <PerformanceScoreHeader color={headColor}>Score</PerformanceScoreHeader>
      <PerformanceScoreContent color={textColor}>{realText}</PerformanceScoreContent>
    </PerformanceScoreWrap>
  )
})
