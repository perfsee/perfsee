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

import { formatTime } from '@perfsee/platform/common'
import { MetricScoreSchema } from '@perfsee/shared'

import { ScoreDesc, ScoreTitle, FailedContent, ColorScore } from './style'

type Props = {
  detail: MetricScoreSchema
  colorful?: boolean
}

export const LighthouseScoreBlock = (props: Props) => {
  const { detail, colorful } = props
  let value: string | number | undefined = detail.value
  let unit: string | undefined = detail.unit
  if (detail.value && detail.formatter === 'duration') {
    const formatted = formatTime(detail.value)
    unit = formatted.unit
    value = formatted.value
  }

  return (
    <Stack styles={{ root: { minWidth: '190px', padding: '12px 16px' } }}>
      <ScoreDesc>{detail.title}</ScoreDesc>
      {typeof value === 'undefined' ? (
        <FailedContent>Failed to calculate</FailedContent>
      ) : (
        <ColorScore score={colorful ? detail.score : undefined}>
          <ScoreTitle>{value}</ScoreTitle>
          <span>{unit}</span>
        </ColorScore>
      )}
    </Stack>
  )
}
