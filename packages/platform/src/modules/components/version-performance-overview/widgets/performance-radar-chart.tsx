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

import { useTheme } from '@emotion/react'
import { FC, memo, useMemo } from 'react'

import { Chart, EChartsOption } from '@perfsee/components/chart'
import { MetricScoreSchema } from '@perfsee/shared'

import { PerformanceRadarWrap } from './styled'
import { formatPerformanceValue, getScoreMapKey, PerformanceKeys, PerformanceScoreColorMap } from './utils'

type Props = {
  metricsScores: MetricScoreSchema[]
}

export const PerformanceRadarChart: FC<Props> = memo(({ metricsScores }) => {
  const theme = useTheme()
  let noData = true

  const data = PerformanceKeys.map(({ key, id }) => {
    const scoreItem = metricsScores.find((item) => item.id === id)

    if (scoreItem) {
      noData = false
    }

    return {
      key,
      id,
      score: Math.floor((scoreItem?.score ?? 0) * 100),
      value: scoreItem?.value,
      formatter: scoreItem?.formatter,
    }
  })

  const option = useMemo<EChartsOption>(
    () => ({
      radar: {
        indicator: [
          { name: 'FCP', max: 100 },
          { name: 'LCP', max: 100 },
          { name: 'TTI', max: 100 },
          { name: 'CLS', max: 100 },
          { name: 'SI', max: 100 },
          { name: 'TBT', max: 100 },
        ],
        axisName: {
          formatter: (text: string) => {
            const item = data.find((item) => item.key === text)
            const scoreKey = getScoreMapKey(item!.score)
            const value = formatPerformanceValue(item!.value, item!.formatter)

            return `{key|${text}}\n{${scoreKey}|${value}}`
          },
          rich: {
            key: {
              fontWeight: 500,
              color: theme.text.colorInWaringBlock,
            },
            low: {
              fontWeight: 500,
              color: PerformanceScoreColorMap.low.textColor,
            },
            medium: {
              fontWeight: 500,
              color: PerformanceScoreColorMap.medium.textColor,
            },
            high: {
              fontWeight: 500,
              color: PerformanceScoreColorMap.high.textColor,
            },
          },
        },
      },
      series: [
        {
          type: 'radar',
          areaStyle: {},
          name: 'Performance',
          data: [{ value: data.map((item) => item.score) }],
          animationDuration: 0,
          animationDurationUpdate: 0,
        },
      ],
    }),
    [data, theme],
  )

  if (noData) {
    return null
  }

  return (
    <PerformanceRadarWrap>
      <Chart style={{ height: '400px' }} option={option} mergeCustomOption={false} hideBorder />
    </PerformanceRadarWrap>
  )
})
