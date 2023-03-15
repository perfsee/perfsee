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

import { LinkOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { compact } from 'lodash'
import { useCallback, useMemo } from 'react'

import { ForeignLink } from '@perfsee/components'
import {
  Chart,
  EChartsOption,
  renderTooltip,
  TooltipRendererParam,
  ChartHeader,
  formatChartData,
} from '@perfsee/components/chart'
import { pathFactory } from '@perfsee/shared/routes'

import { CustomTooltip, ColorDot } from '../../project/statistics/charts/style'

export type ScoreDataType = {
  id: number
  hash: string
  projectId: string
  artifactName: string
  projectAndName: string
  createdAt: string
  score: number
}

const xAxisLabel = {
  formatter: (item: string | number) => `${dayjs(item).format('YYYY-MM-DD HH:mm')}`,
}

type Props = {
  flatData: ScoreDataType[]
  minY: number
  maxY: number
  loading: boolean
}

export const BundleScoreChart = ({ flatData, minY, maxY, loading }: Props) => {
  const { data, groupData } = useMemo(() => {
    return formatChartData<ScoreDataType, ScoreDataType>(flatData, 'projectAndName', 'createdAt', 'score')
  }, [flatData])

  const chartSeries = useMemo<EChartsOption['series']>(() => {
    return Object.entries(data).map(([key, value]) => ({
      type: 'line',
      smooth: true,
      name: key,
      data: value,
    }))
  }, [data])

  const tooltipFormatter = useCallback(
    (_params: TooltipRendererParam) => {
      const params = Array.isArray(_params) ? _params : [_params]

      if (!params.length) {
        return ''
      }

      const items = compact(
        params.map((param) => {
          const { seriesName, data, color } = param
          const [hash] = data as [string]
          if (!seriesName || !hash || !groupData[seriesName]) {
            return null
          }
          return { ...groupData[seriesName][hash], color: color as string }
        }),
      )

      const id = items[0]?.id
      const title = items[0].hash
      const time = dayjs(items[0].createdAt).format('YYYY/MM/DD HH:mm')
      const projectId = items[0].projectId

      const node = (
        <CustomTooltip>
          {id && (
            <p>
              Bundle ID:{' '}
              <ForeignLink href={pathFactory.project.bundle.detail({ projectId, bundleId: id })}>
                <LinkOutlined />
                {id}
              </ForeignLink>
            </p>
          )}
          <p>Commit hash: {title}</p>
          <p>Created: {time}</p>
          <table>
            <thead>
              <tr>
                <th />
                <th>project id</th>
                <th>artifact name</th>
                <th>score</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ projectId, color, artifactName, score }, i) => (
                <tr key={i}>
                  <td>
                    <ColorDot color={color} />
                  </td>
                  <td>{projectId}</td>
                  <td>{artifactName}</td>
                  <td>{score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CustomTooltip>
      )

      return renderTooltip('artifact-size', node)
    },
    [groupData],
  )

  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        formatter: tooltipFormatter,
      },
      yAxis: {
        min: minY,
        max: maxY,
      },
      xAxis: {
        type: 'time',
        axisLabel: xAxisLabel,
      },
      series: chartSeries,
    }),
    [chartSeries, minY, maxY, tooltipFormatter],
  )

  return (
    <Chart option={option} showLoading={loading} notMerge={true} hideBorder>
      <ChartHeader title="Bundle Score History" tips="From baseline branch data" />
    </Chart>
  )
}
