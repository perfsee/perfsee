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
import { FC } from 'react'

import { ProjectInfo } from '@perfsee/platform/modules/shared'
import { ReportNode } from '@perfsee/platform/modules/version-report/types'

import {
  FlexCenterWrap,
  ProjectSubCountName,
  ProjectSubCountNum,
  ScoreDisplayItem,
  VersionDetailItem,
  VersionDetailItemHeader,
} from './styled'
import { getScoreColors } from './utils'

type Props = {
  project: ProjectInfo
  report: ReportNode
  scores?: Record<string, LH.Result.Category>
}

const formatScore = (score?: number | null) => {
  if (typeof score !== 'number') {
    return null
  }

  return Math.round(score * 100)
}

const OtherMetric = [
  { key: 'seo', title: 'SEO' },
  { key: 'accessibility', title: 'Accessibility' },
  { key: 'best-practices', title: 'Best Practices' },
  { key: 'pwa', title: 'PWA' },
]

export const LhOtherScore: FC<Props> = ({ scores }) => {
  const a = scores
    ? OtherMetric.map(({ key, title }) => {
        const score = formatScore(scores[key]?.score)
        if (typeof score !== 'number') {
          return null
        }
        return (
          <ScoreDisplayItem key={key}>
            <ProjectSubCountName>{title}</ProjectSubCountName>
            <Stack tokens={{ childrenGap: 4 }} horizontal verticalAlign="end">
              <ProjectSubCountNum color={getScoreColors(score).textColor}>{score}</ProjectSubCountNum>
            </Stack>
          </ScoreDisplayItem>
        )
      })
    : undefined

  return (
    <VersionDetailItem>
      <VersionDetailItemHeader>
        <span>Other</span>
      </VersionDetailItemHeader>
      <FlexCenterWrap>{a}</FlexCenterWrap>
    </VersionDetailItem>
  )
}
