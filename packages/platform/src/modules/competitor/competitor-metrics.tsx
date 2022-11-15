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

import { isInteger, compact } from 'lodash'
import { useMemo, useCallback, useState, FC } from 'react'

import {
  Chart,
  EChartsOption,
  LineSeriesOption,
  renderTooltip,
  TooltipRendererParam,
  formatChartData,
} from '@perfsee/components/chart'
import { formatTime } from '@perfsee/platform/common'
import { useProject } from '@perfsee/platform/modules/shared'
import { LighthouseScoreMetric } from '@perfsee/shared'

import { MeasureSelector, SnapshotChartTooltip, SnapshotChartItemType } from '../project/statistics/charts/components'
import { Metrics } from '../project/statistics/charts/utils'

import { SnapshotReport } from './module'

type Props = {
  reports: SnapshotReport[]
}
const xAxisLabel = {
  formatter: (item: string | number) => `Snapshot #${item}`,
}

export const CompetitorMetricsChart: FC<Props> = ({ reports }) => {
  const project = useProject()

  const [measure, setMeasure] = useState<string>(LighthouseScoreMetric.Performance)

  const formatter = useCallback(
    (v: string | number) => {
      if (Metrics[measure].formatter === 'duration') {
        const { value, unit } = formatTime(Number(v))
        return `${value}${unit}`
      }
      return typeof v === 'number' && !isInteger(v) ? v.toFixed(3) : `${v}`
    },
    [measure],
  )

  const yAxisLabel = useMemo(() => ({ formatter }), [formatter])

  const dataFormatter = useCallback(
    (report: SnapshotReport) => {
      return {
        createdAt: report.createdAt,
        snapshotId: report.snapshot.id,
        reportId: report.id,
        value: report.metrics[measure],
        pageName: report.page.name,
        envName: report.environment.name,
        profileName: report.profile.name,
      } as SnapshotChartItemType
    },
    [measure],
  )

  const { data, groupData } = useMemo(() => {
    const sortedReports = reports.slice().sort((a, b) => a.snapshot.id - b.snapshot.id)

    return formatChartData<SnapshotReport, SnapshotChartItemType>(
      sortedReports,
      'pageName',
      'snapshotId',
      'value',
      dataFormatter,
    )
  }, [reports, dataFormatter])

  const tooltipFormatter = useCallback(
    (_params: TooltipRendererParam) => {
      const params = Array.isArray(_params) ? _params : [_params]

      if (!params.length || !project) {
        return ''
      }

      const items = compact(
        params.map((param) => {
          const { seriesName, data, color } = param
          const [id] = data as [string]
          if (!seriesName || !id || !groupData[seriesName]) {
            return null
          }
          return { data: groupData[seriesName][id], color: color as string }
        }),
      )

      const content = (
        <SnapshotChartTooltip
          title={Metrics[measure].title}
          formatter={formatter}
          dataList={items.sort((a, b) => b.data.value - a.data.value)}
          project={project}
        />
      )

      return renderTooltip('competitor-metrics', content)
    },
    [formatter, groupData, measure, project],
  )

  const chartSeries = useMemo(() => {
    return Object.entries(data).map(
      ([key, value]) =>
        ({
          type: 'line',
          smooth: true,
          symbol: 'none',
          name: key,
          data: value,
        } as LineSeriesOption),
    )
  }, [data])

  const option = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        formatter: tooltipFormatter,
      },
      xAxis: {
        axisLabel: xAxisLabel,
      },
      yAxis: {
        axisLabel: yAxisLabel,
      },
      series: chartSeries,
    }),
    [chartSeries, tooltipFormatter, yAxisLabel],
  )

  return (
    <>
      <MeasureSelector isFirst={true} measure={measure} metrics={Metrics} onChange={setMeasure} />
      <Chart option={option} hideBorder />
    </>
  )
}
