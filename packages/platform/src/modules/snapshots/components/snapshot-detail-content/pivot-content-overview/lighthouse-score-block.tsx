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

import { getScoreColor, ScoreBlock } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { MetricScoreSchema } from '@perfsee/shared'

type Props = {
  detail: MetricScoreSchema
  colorful?: boolean
  hideTitle?: boolean
}

export const LighthouseScoreBlock = (props: Props) => {
  const { detail, colorful, hideTitle } = props
  let value: string | number | undefined = detail.value
  let unit: string | undefined = detail.unit
  if (detail.value && detail.formatter === 'duration') {
    const formatted = formatTime(detail.value)
    unit = formatted.unit
    value = formatted.value
  }

  let color
  if (typeof detail.score === 'number' && colorful) {
    color = getScoreColor(detail.score * 100)
  }

  return <ScoreBlock title={hideTitle ? null : detail.title} color={color} value={value} unit={unit} />
}
