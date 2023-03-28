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

import dayjs from 'dayjs'
import { isInteger } from 'lodash'

import { formatTime } from '@perfsee/platform/common'

import { ColorSpan } from '../styled'

import { SnapshotRecord } from './module'

type Props = {
  latest?: SnapshotRecord
  oldest?: SnapshotRecord
  latestValue?: number
  oldestValue?: number
  type: string
}

export const formatMetric = (key: string, v?: number) => {
  if (v && key !== 'CLS') {
    const { value, unit } = formatTime(v)
    return `${value}${unit}`
  }
  return typeof v === 'number' && !isInteger(v) ? v.toFixed(3) : v
}

export function MetricDiff({ type, latest, oldest, latestValue, oldestValue }: Props) {
  if (typeof latestValue === 'number' && typeof oldestValue === 'number') {
    const diff = latestValue - oldestValue
    return (
      <div>
        <div>
          <p>
            Latest Snapshot#{latest!.id} {dayjs(latest!.createdAt).format('YYYY-MM-DD HH:mm')}
          </p>
          <p>Average: {formatMetric(type, latestValue)}</p>
        </div>
        <div>
          <p>
            Oldest Snapshot#{oldest!.id} {dayjs(oldest!.createdAt).format('YYYY-MM-DD HH:mm')}
          </p>
          <p>Average: {formatMetric(type, oldestValue)}</p>
        </div>
        {diff !== 0 && (
          <ColorSpan good={diff < 0}>
            {diff > 0 ? '+' : '-'}
            {formatMetric(type, Math.abs(diff))} {((diff / latestValue) * 100).toFixed(2) + '%'}
          </ColorSpan>
        )}
      </div>
    )
  }

  if (typeof oldestValue === 'number') {
    return (
      <div>
        <p>
          Snapshot#{oldest!.id} {dayjs(oldest!.createdAt).format('YYYY-MM-DD HH:mm')}
        </p>
        <p>Average: {formatMetric(type, oldestValue)}</p>
      </div>
    )
  }

  return null
}
