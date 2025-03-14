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
import { Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { compact, floor } from 'lodash'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ForeignLink, Space, DateRangeSelector, useQueryString } from '@perfsee/components'
import {
  Chart,
  EChartsOption,
  renderTooltip,
  TooltipRendererParam,
  ChartHeader,
  formatChartData,
} from '@perfsee/components/chart'
import { ArtifactNameSelector, BranchSelector, EntrypointSelector } from '@perfsee/platform/modules/components'
import { useProject, useProjectRouteGenerator } from '@perfsee/platform/modules/shared'
import { PrettyBytes, Size } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { MeasureSelector } from '../components'
import { CustomTooltip, ColorDot } from '../style'

import { EntrypointsChartModule } from './module'

type DataType = {
  id: number
  hash: string
  artifactName: string
  entryPoint: string
  score: number
} & Size

const Metrics = {
  ['Total Size']: {
    title: 'Total Size',
    des: 'Total size of the entrypoint',
    formatter: 'duration',
  },
  ['Initial Size']: {
    title: 'Initial Size',
    des: 'Initial size of the entrypoint',
    formatter: 'duration',
  },
  ['Score']: {
    title: 'Score',
    des: 'Score of the entrypoint',
    formatter: 'duration',
  },
}

const xAxisLabel = {
  formatter: (item: string) => `#${item}`,
}

export const ArtifactSizeChart = () => {
  const project = useProject()
  const generateProjectRoute = useProjectRouteGenerator()
  const [
    {
      startTime = dayjs().subtract(1, 'months').startOf('day').unix(),
      endTime = dayjs().endOf('day').unix(),
      branch,
      name,
      entrypoint,
    },
    updateQueryString,
  ] = useQueryString<{ startTime: number; endTime: number; branch: string; name: string; entrypoint?: string }>()

  const startDate = useMemo(() => dayjs.unix(startTime).toDate(), [startTime])
  const endDate = useMemo(() => dayjs.unix(endTime).toDate(), [endTime])

  const [{ entrypoints }, { getAggregatedEntrypoints }] = useModule(EntrypointsChartModule)
  const [measure, setMeasure] = useState<string>('Total Size')

  const useInitialSize = measure === 'Initial Size'
  const useScore = measure === 'Score'

  const handleStartDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        updateQueryString({ startTime: dayjs(date).unix() })
      }
    },
    [updateQueryString],
  )

  const handleEndDateSelect = useCallback(
    (date?: Date | null) => {
      if (date) {
        updateQueryString({ endTime: dayjs(date).unix() })
      }
    },
    [updateQueryString],
  )

  const handleBranchSelect = useCallback(
    (branch?: string) => {
      updateQueryString({ branch })
    },
    [updateQueryString],
  )

  const handleArtifactNameSelect = useCallback(
    (artifactName?: string) => {
      updateQueryString({ name: artifactName })
    },
    [updateQueryString],
  )

  const handleEntrypointsSelect = useCallback(
    (entrypoint?: string) => {
      updateQueryString({ entrypoint })
    },
    [updateQueryString],
  )

  useEffect(() => {
    getAggregatedEntrypoints({
      from: dayjs.unix(startTime).toISOString(),
      to: dayjs.unix(endTime).toISOString(),
      branch: branch,
      artifactName: name,
      entrypoint,
    })
  }, [startTime, endTime, branch, name, entrypoint, getAggregatedEntrypoints])

  const yAxisLabel = useMemo(() => {
    return useScore
      ? {
          formatter: (item: string | number) => `${item}`,
        }
      : {
          formatter: (item: string | number) => `${item} KB`,
        }
  }, [useScore])

  const { flatData, largest, smallest } = useMemo(() => {
    const data: DataType[] = []
    let largest = 0
    let smallest = Number.MAX_SAFE_INTEGER
    // avoid weird chart looking
    if (!entrypoints?.length) {
      largest = 1000
      smallest = 0
    } else {
      entrypoints.forEach(({ artifactName, entrypoint, artifactId, hash, size, initialSize, score }) => {
        const record = {
          id: artifactId,
          hash,
          artifactName,
          entryPoint: entrypoint,
          raw: useInitialSize ? initialSize.raw / 1000 : size.raw / 1000,
          gzip: useInitialSize ? initialSize.gzip / 1000 : size.gzip / 1000,
          brotli: useInitialSize ? initialSize.brotli / 1000 : size.brotli / 1000,
          score,
        } as DataType
        largest = Math.max(largest, record.raw)
        smallest = Math.min(smallest, record.raw)
        data.push(record)
      })
    }

    data.sort((a, b) => a.id - b.id)
    return { flatData: data, largest, smallest }
  }, [entrypoints, useInitialSize])

  const { data, groupData } = useMemo(() => {
    return formatChartData<DataType, DataType>(flatData, 'entryPoint', 'id', useScore ? 'score' : 'raw')
  }, [flatData, useScore])

  const range = useMemo(() => {
    const gap = (largest - smallest) / 2

    if (!gap) {
      return largest / 2
    } else if (gap < 200) {
      return 200
    }

    return gap
  }, [largest, smallest])

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

      const node = (
        <CustomTooltip>
          {id && (
            <p>
              Bundle ID:{' '}
              <ForeignLink href={generateProjectRoute(pathFactory.project.bundle.detail, { bundleId: id })}>
                <LinkOutlined />
                {id}
              </ForeignLink>
            </p>
          )}
          <p>Commit hash: {title}</p>
          <table>
            <thead>
              <tr>
                <th />
                <th>artifact name</th>
                <th>entrypoint</th>
                <th>score</th>
                <th>raw{useInitialSize ? '(initial)' : ''}</th>
                <th>gzip{useInitialSize ? '(initial)' : ''}</th>
                <th>brotli{useInitialSize ? '(initial)' : ''}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ color, artifactName, entryPoint, raw, gzip, brotli, score }, i) => (
                <tr key={i}>
                  <td>
                    <ColorDot color={color} />
                  </td>
                  <td>{artifactName}</td>
                  <td>{entryPoint}</td>
                  <td>{score}</td>
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
    [generateProjectRoute, groupData, useInitialSize],
  )

  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        formatter: tooltipFormatter,
      },
      yAxis: {
        axisLabel: yAxisLabel,
        minInterval: useScore ? 1 : 100,
        min: useScore ? 0 : floor(Math.max(0, smallest - range)),
        max: useScore ? 100 : floor(largest + range + 1),
      },
      xAxis: {
        axisLabel: xAxisLabel,
      },
      series: chartSeries,
    }),
    [chartSeries, largest, range, smallest, tooltipFormatter, yAxisLabel, useScore],
  )

  if (!project) {
    return null
  }

  return (
    <Chart option={option} showLoading={!entrypoints} notMerge={true} hideBorder>
      <ChartHeader title={`Entrypoint ${measure} History`}>
        <Space wrap>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
            <MeasureSelector isFirst={true} metrics={Metrics} measure={measure} onChange={setMeasure} />
            <ArtifactNameSelector defaultArtifactName={name} onChange={handleArtifactNameSelect} />
            <BranchSelector defaultBranch={branch} onChange={handleBranchSelect} />
            <EntrypointSelector
              defaultEntrypoints={entrypoint}
              artifactName={name}
              branch={branch}
              onChange={handleEntrypointsSelect}
            />
          </Stack>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChanged={handleStartDateSelect}
            onEndDateChanged={handleEndDateSelect}
          />
        </Space>
      </ChartHeader>
    </Chart>
  )
}
