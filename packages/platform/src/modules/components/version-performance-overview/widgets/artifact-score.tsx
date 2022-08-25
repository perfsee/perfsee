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

import { Size } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { useGenerateProjectRoute } from '../../../shared'

import { SizeDisplay } from './size-display'
import {
  FlexCenterWrap,
  ProjectSubCountName,
  ProjectSubCountNum,
  ScoreDisplayItem,
  StyledLink,
  VersionDetailItem,
  VersionDetailItemHeader,
} from './styled'
import { getScoreColors } from './utils'

type Props = {
  bundleId: number
  score: number | null
  size?: Size | null
}

export const ArtifactScore: FC<Props> = ({ score, size, bundleId }) => {
  const generateProjectRoute = useGenerateProjectRoute()
  const bundleLink = generateProjectRoute(pathFactory.project.bundle.detail, { bundleId })

  return (
    <VersionDetailItem>
      <VersionDetailItemHeader>
        <span>Bundle</span>
        <StyledLink to={bundleLink}>Detail</StyledLink>
      </VersionDetailItemHeader>
      <FlexCenterWrap>
        <ScoreDisplayItem>
          <ProjectSubCountName>Bundle Score</ProjectSubCountName>
          <Stack tokens={{ childrenGap: 4 }} horizontal verticalAlign="end">
            <ProjectSubCountNum color={getScoreColors(score).textColor}>{score ?? '-'}</ProjectSubCountNum>
          </Stack>
        </ScoreDisplayItem>
        <ScoreDisplayItem>
          <ProjectSubCountName>Bundle Size</ProjectSubCountName>
          <SizeDisplay size={size?.raw} />
        </ScoreDisplayItem>
        <ScoreDisplayItem>
          <ProjectSubCountName>Gzip Size</ProjectSubCountName>
          <SizeDisplay size={size?.gzip} />
        </ScoreDisplayItem>
        <ScoreDisplayItem>
          <ProjectSubCountName>Brotil Size</ProjectSubCountName>
          <SizeDisplay size={size?.brotli} />
        </ScoreDisplayItem>
      </FlexCenterWrap>
    </VersionDetailItem>
  )
}
