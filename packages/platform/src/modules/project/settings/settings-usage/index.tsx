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

import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useEffect, useMemo, useState } from 'react'

import { DateRangeSelector, SingleSelector, Space } from '@perfsee/components'
import { Chart, ChartHeader, EChartsOption, renderTooltip, TooltipRendererParam } from '@perfsee/components/chart'

import { SettingsUsageModule } from './module'
import { FormatLabelWrapper } from './style'
import { TimeUsageToolTip } from './tooltip'
import { formatUsage, USAGE_FORMAT } from './utils'

export const TimeUsage = () => {
  const [startDate, setStartDate] = useState(dayjs().subtract(1, 'month').toDate())
  const [endDate, setEndDate] = useState(dayjs().toDate())
  const [format, setFormat] = useState(USAGE_FORMAT.Minute)

  const [state, { fetchUsages }] = useModule(SettingsUsageModule)

  const formatOptions = useMemo(() => {
    return Object.keys(USAGE_FORMAT).map((format) => ({
      id: format as USAGE_FORMAT,
      name: format,
    }))
  }, [])

  const option = useMemo<EChartsOption>(
    () =>
      ({
        tooltip: {
          formatter: (_params: TooltipRendererParam) => {
            const params = Array.isArray(_params) ? _params : [_params]

            const items = params.map((param) => ({
              color: param.color as string,
              name: param.seriesName!,
              value: param.value[1] as number,
            }))
            return renderTooltip(
              'project-time-usage',
              <TimeUsageToolTip items={items} title={params[0].value[0] as string} formatType={format} />,
            )
          },
          axisPointer: {
            label: {
              formatter: ({ value }) => dayjs(value).format('YYYY-MM-DD'),
            },
          },
        },
        yAxis: {
          axisLabel: {
            formatter: (value: number) => formatUsage(value, format),
          },
        },
        xAxis: {
          type: 'time',
          minInterval: 60 * 60 * 24 * 1000, // 1day
          axisLabel: {
            formatter: (value: number) => dayjs(value).format('YYYY-MM-DD'),
          },
        },
        series: state.data.map(({ jobType, data }) => ({
          name: jobType,
          type: 'line',
          stack: 'Total',
          areaStyle: {},
          emphasis: {
            focus: 'series',
          },
          data: Object.entries(data),
        })),
      } as EChartsOption),
    [format, state],
  )

  useEffect(() => {
    fetchUsages({
      from: startDate.toISOString(),
      to: endDate.toISOString(),
    })
  }, [endDate, fetchUsages, startDate])

  return (
    <Chart option={option} hideBorder>
      <ChartHeader title="Time Usage">
        <Space>
          <span>
            <FormatLabelWrapper>Format:</FormatLabelWrapper>
            <SingleSelector options={formatOptions} id={format} onChange={setFormat} />
          </span>
          <DateRangeSelector
            startDate={startDate}
            endDate={endDate}
            onStartDateChanged={setStartDate}
            onEndDateChanged={setEndDate}
          />
        </Space>
      </ChartHeader>
    </Chart>
  )
}
