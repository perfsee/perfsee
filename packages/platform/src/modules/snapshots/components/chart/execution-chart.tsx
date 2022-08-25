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

import * as echarts from 'echarts/core'
import { groupBy } from 'lodash'
import { memo, useCallback, useMemo } from 'react'

import {
  Chart,
  ChartHeader,
  EChartsOption,
  CustomRenderCallback,
  LineSeriesOption,
  CustomSeriesOption,
  TooltipRendererParam,
  renderTooltip,
} from '@perfsee/components/chart'
import { formatTime } from '@perfsee/platform/common'
import { Task } from '@perfsee/tracehouse'

import { TraceTimesWithoutFCP, RecordCategory, RecordType } from '../../snapshot-type'

import { ExecutionChartTooltip } from './chart-tooltip'
import { getRecordTypeParams, getSortedTimingType } from './helper'
import { StyleChartWrapper } from './style'

type Props = {
  tasks?: Task[]
  timings?: TraceTimesWithoutFCP
  defaultEndTime?: number
  hideTitle?: boolean
}

const axisLabel = {
  formatter(text: string | number) {
    const format = formatTime(Number(text))
    return `${format.value}${format.unit}`
  },
}

const kindLegendFormat = (text: string) => getRecordTypeParams(text).text ?? text

export const ExecutionChart = memo((props: Props) => {
  const { tasks, timings, defaultEndTime, hideTitle } = props

  const metrics = useMemo(() => {
    if (!timings) {
      return []
    }

    return getSortedTimingType(timings).map((type) => {
      return {
        kind: type,
        startTime: timings[type],
        cat: RecordCategory.Metric,
      }
    })
  }, [timings])

  const renderItem = useCallback<CustomRenderCallback>((params, api) => {
    const isLongTask = params.seriesName === 'longTask'
    // can't satisfy defined parameters
    const originHeight = (api.size as (data: number[]) => number[])?.([0, 1])[1]

    const categoryIndex = api.value(0)
    const start = api.coord([api.value(1), categoryIndex])
    const end = api.coord([api.value(2), categoryIndex])
    const height = isLongTask ? originHeight * 0.03 : originHeight * 0.4

    const rectShape = echarts.graphic.clipRectByRect(
      {
        x: start[0],
        y: isLongTask ? start[1] - originHeight * 0.6 : start[1] - height * 1.2,
        width: end[0] - start[0],
        height: height,
      },
      {
        x: params.coordSys['x'],
        y: params.coordSys['y'],
        width: params.coordSys['width'],
        height: params.coordSys['height'],
      },
    )

    return (
      rectShape && {
        type: 'rect',
        transition: ['shape'],
        shape: rectShape,
        style: {
          fill: getRecordTypeParams(params.seriesName).color,
        },
      }
    )
  }, [])

  const tooltipFormatter = useCallback((_params: TooltipRendererParam) => {
    const params = Array.isArray(_params) ? _params[0] : _params

    if (params.componentType === 'markLine') {
      const { name, value } = params

      return `${name}: ${value}ms`
    }

    const task: Task = params.data?.['value']?.[3]
    if (!task) {
      return ''
    }

    if (params.seriesName === RecordType.longTask) {
      return `Long Task (${(task.duration - 50).toFixed(2)}ms)`
    }

    const child = <ExecutionChartTooltip data={task} />

    return renderTooltip('execution-chart', child)
  }, [])

  const chartSeries = useMemo<Array<LineSeriesOption | CustomSeriesOption>>(() => {
    const eventSeries = Object.entries(groupBy(tasks, 'kind')).map(
      ([groupId, value]) =>
        ({
          type: 'custom',
          name: groupId,
          data: value.map((item) => ({
            kind: groupId,
            value: [0, item.startTime, item.endTime, item],
            itemStyle: {
              color: getRecordTypeParams(groupId).color,
            },
          })),
          renderItem,
          encode: {
            x: [1, 2],
            y: 0,
          },
        } as CustomSeriesOption),
    )

    const longTaskSeries: CustomSeriesOption = {
      type: 'custom',
      name: RecordType.longTask,
      data: (tasks ?? [])
        .filter((t) => t.duration > 50)
        .map((task) => ({
          kind: RecordType.longTask,
          value: [0, task.startTime + 50, task.endTime, task],
          itemStyle: {
            color: getRecordTypeParams(RecordType.longTask).color,
          },
        })),
      renderItem,
      encode: {
        x: [1, 2],
        y: 0,
      },
    }

    const metricSeries = metrics.map(
      (metric) =>
        ({
          type: 'line',
          name: metric.kind,
          markLine: {
            symbol: 'none',
            label: {
              color: '#fff',
              backgroundColor: getRecordTypeParams(metric.kind).color,
            },
            animation: false,
            data: [
              {
                name: metric.kind,
                xAxis: metric.startTime,
                label: {
                  formatter: kindLegendFormat(metric.kind),
                  position: 'insideEndTop',
                  padding: [2, 2, 2, 2],
                },
              },
            ],
          },
        } as LineSeriesOption),
    )

    return [...eventSeries, ...metricSeries, longTaskSeries]
  }, [tasks, metrics, renderItem])

  const maxTime = useMemo(() => {
    if (!tasks?.length) {
      return 0
    }

    if (defaultEndTime) {
      return defaultEndTime
    }

    const lastTask = tasks[tasks.length - 1]
    const lastMetric = metrics[metrics.length - 1]

    return Math.max(lastTask.endTime, lastMetric?.startTime ?? 0)
  }, [defaultEndTime, tasks, metrics])

  const colors = useMemo(() => {
    return chartSeries.map(({ name }) => {
      return name ? getRecordTypeParams(name as string).color : ''
    })
  }, [chartSeries])

  const option = useMemo<EChartsOption>(
    () => ({
      xAxis: {
        min: 0,
        max: maxTime + 100,
        axisLine: { show: false },
        axisLabel,
        type: 'time',
      },
      yAxis: {
        show: false,
      },
      color: colors,
      grid: {
        top: '40px',
        left: '24px',
        right: '32px',
      },
      legend: {
        icon: 'roundRect',
        formatter: kindLegendFormat,
      },
      tooltip: {
        trigger: 'item',
        formatter: tooltipFormatter,
      },
      toolbox: {
        show: true,
        feature: {
          dataZoom: { show: true },
          restore: {},
        },
      },
      series: chartSeries,
    }),
    [chartSeries, colors, maxTime, tooltipFormatter],
  )

  return (
    <StyleChartWrapper>
      <Chart option={option} style={{ height: 220 }}>
        {!hideTitle && (
          <ChartHeader
            title="Main thread execution timeline"
            desc="Blocking tasks that took more than 50ms to execute during page load."
          />
        )}
      </Chart>
    </StyleChartWrapper>
  )
})
