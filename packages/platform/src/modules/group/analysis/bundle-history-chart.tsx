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
import { compact, floor } from 'lodash'
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
import { PrettyBytes, Size } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { CustomTooltip, ColorDot } from '../../project/statistics/charts/style'

export type SizeDataType = {
  id: number
  hash: string
  artifactName: string
  entryPoint: string
  projectAndEntry: string
  createdAt: string
  projectId: string
} & Size

const yAxisLabel = {
  formatter: (item: string | number) => `${item} KB`,
}

const xAxisLabel = {
  formatter: (item: string | number) => `${dayjs(item).format('YYYY-MM-DD HH:mm')}`,
}

type Props = {
  flatData: SizeDataType[]
  minY: number
  maxY: number
  loading: boolean
}

export const BundleHistoryChart = ({ flatData, minY, maxY, loading }: Props) => {
  const { data, groupData } = useMemo(() => {
    return formatChartData<SizeDataType, SizeDataType>(flatData, 'projectAndEntry', 'createdAt', 'raw')
  }, [flatData])

  const range = useMemo(() => {
    const gap = (maxY - minY) / 2

    if (!gap) {
      return maxY / 2
    } else if (gap < 200) {
      return 200
    }

    return gap
  }, [maxY, minY])

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
                <th>artifact name</th>
                <th>entrypoint</th>
                <th>raw</th>
                <th>gzip</th>
                <th>brotli</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ color, artifactName, entryPoint, raw, gzip, brotli }, i) => (
                <tr key={i}>
                  <td>
                    <ColorDot color={color} />
                  </td>
                  <td>{artifactName}</td>
                  <td>{entryPoint}</td>
                  <td>{PrettyBytes.create(raw * 1000).toString()}</td>
                  <td>{PrettyBytes.create(gzip * 1000).toString()}</td>
                  <td>{PrettyBytes.create(brotli * 1000).toString()}</td>
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
        axisLabel: yAxisLabel,
        minInterval: 100,
        min: floor(Math.max(0, minY - range)),
        max: floor(maxY + range + 1),
      },
      xAxis: {
        type: 'time',
        axisLabel: xAxisLabel,
      },
      series: chartSeries,
    }),
    [chartSeries, maxY, minY, range, tooltipFormatter],
  )

  return (
    <Chart option={option} showLoading={loading} notMerge={true} hideBorder>
      <ChartHeader
        title="Bundle Size History"
        tips="The legend is group by 'projectName-entrypoint', You can click legends to toggle displaying series in the chart."
      />
    </Chart>
  )
}
