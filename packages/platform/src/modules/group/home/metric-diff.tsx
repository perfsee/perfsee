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

import { isInteger } from 'lodash'

import { formatTime } from '@perfsee/platform/common'

import { ColorSpan } from '../styled'

type Props = {
  current?: number
  baseline?: number
  type: string
}

export const formatMetric = (key: string, v?: number) => {
  if (v && key !== 'CLS') {
    const { value, unit } = formatTime(v)
    return `${value}${unit}`
  }
  return typeof v === 'number' && !isInteger(v) ? v.toFixed(3) : `${v}`
}

export const MetricDiff = ({ type, current, baseline }: Props) => {
  if (typeof current !== 'number') {
    return <span>-</span>
  }
  if (typeof baseline !== 'number') {
    return <span>{formatMetric(type, current)}</span>
  }

  const diff = current - baseline
  return (
    <div>
      <p>{formatMetric(type, current)}</p>
      <ColorSpan good={diff < 0}>
        {diff > 0 ? '+' : '-'}
        {formatMetric(type, Math.abs(diff))} {((diff / current) * 100).toFixed(2) + '%'}
      </ColorSpan>
    </div>
  )
}
