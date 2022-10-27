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
import { MarkLineOption } from 'echarts/types/dist/shared'
import { compact, isInteger } from 'lodash'
import { useEffect, useMemo, useState, useCallback, memo } from 'react'

import { DateRangeSelector, SingleSelector, Space, useQueryString } from '@perfsee/components'
import {
  Chart,
  ChartHeader,
  EChartsOption,
  formatChartData,
  renderTooltip,
  TooltipRendererParam,
} from '@perfsee/components/chart'
import { formatTime } from '@perfsee/platform/common'
import { PropertyModule, useProject } from '@perfsee/platform/modules/shared'
import { LighthouseScoreMetric } from '@perfsee/shared'

import { MeasureSelector, SnapshotChartTooltip, SnapshotChartItemType } from '../components'
import { Metrics } from '../utils'

import { SnapshotsChartModule, SnapshotReport } from './module'

const xAxisLabel = {
  formatter: (item: string | number) => `Snapshot #${item}`,
}
export const SnapshotMetricsChart = memo(() => {
  const project = useProject()
  const [{ reports }, dispatcher] = useModule(SnapshotsChartModule)

  const [{ pages, environments, profileMap, pageRelationMap }, { fetchProperty, fetchPageRelation }] = useModule(
    PropertyModule,
    {
      selector: (s) => ({
        pages: s.pages.filter((p) => !p.isCompetitor && !p.isTemp),
        environments: s.environments,
        profileMap: s.profileMap,
        pageRelationMap: s.pageRelationMap,
      }),
      dependencies: [],
    },
  )

  useEffect(() => {
    fetchProperty()
    fetchPageRelation()
  }, [fetchProperty, fetchPageRelation])

  const [measure, setMeasure] = useState<string>(LighthouseScoreMetric.Performance)

  const defaultStartDate = useMemo(() => dayjs().subtract(1, 'months'), [])
  const defaultEndDate = useMemo(() => dayjs(), [])
  const [
    {
      startTime = defaultStartDate.unix(),
      endTime = defaultEndDate.unix(),
      pageId = pages[0]?.id,
      envId = environments[0]?.id,
      profileId: profileIdQuery,
    },
    updateQueryString,
  ] = useQueryString<{ startTime?: number; endTime?: number; pageId?: number; envId?: number; profileId?: number }>()

  const pageProfiles = useMemo(() => {
    if (typeof pageId === 'number' && pageRelationMap.size && profileMap.size) {
      return pageRelationMap.get(pageId)?.profileIds.map((profileId) => profileMap.get(profileId)!) ?? []
    }
    return []
  }, [pageId, pageRelationMap, profileMap])

  let profileId: number
  if (!profileIdQuery) {
    profileId = pageProfiles[0]?.id
  } else {
    profileId = profileIdQuery
  }

  const startDate = useMemo(() => dayjs.unix(startTime).toDate(), [startTime])
  const endDate = useMemo(() => dayjs.unix(endTime).toDate(), [endTime])

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

  const handlePageSelect = useCallback(
    (pageId: number) => {
      if (pageId) {
        updateQueryString({ pageId, profileId: undefined })
      }
    },
    [updateQueryString],
  )

  const handleEnvSelect = useCallback(
    (envId: number) => {
      if (envId) {
        updateQueryString({ envId })
      }
    },
    [updateQueryString],
  )

  const handleProfileSelect = useCallback(
    (profileId: number) => {
      if (profileId) {
        updateQueryString({ profileId })
      }
    },
    [updateQueryString],
  )

  useEffect(() => {
    if (!Metrics[measure]) {
      setMeasure(LighthouseScoreMetric.Performance)
    }
  }, [measure])

  const formatter = useCallback(
    (v: string | number) => {
      if (!Metrics[measure]) {
        return ''
      }

      if (Metrics[measure].formatter === 'duration') {
        const { value, unit } = formatTime(Number(v))
        return `${value}${unit}`
      }

      return typeof v === 'number' && !isInteger(v)
        ? v.toFixed(Metrics[measure].formatter === 'decimal' ? 3 : 1)
        : `${v}`
    },
    [measure],
  )

  const yAxisLabel = useMemo(() => ({ formatter }), [formatter])

  useEffect(() => {
    if (envId && pageId && profileId) {
      dispatcher.getAggregatedSnapshots({
        pageId,
        profileId,
        envId,
        from: dayjs.unix(startTime).toISOString(),
        to: dayjs.unix(endTime).toISOString(),
        length: null,
      })
    }
  }, [dispatcher, startTime, endTime, profileId, pageId, envId])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  const onRenderEnvTitle = useCallback((name: string) => {
    return `ENV: ${name}`
  }, [])

  const dataFormatter = useCallback(
    (data: SnapshotReport) => {
      const { createdAt, page, profile, environment } = data
      return {
        reportId: data.id,
        createdAt,
        snapshotId: data.snapshot.id,
        value: data.metrics[measure],
        pageName: page.name,
        profileName: profile.name,
        envName: environment.name,
      } as SnapshotChartItemType
    },
    [measure],
  )

  const { data, groupData } = useMemo(() => {
    if (!reports || !envId || !pageId) {
      return { data: null, groupData: null, xAxisData: [] }
    }

    const sortedReports = reports.slice().sort((a, b) => a.snapshot.id - b.snapshot.id)

    return formatChartData<SnapshotReport, SnapshotChartItemType>(
      sortedReports,
      'profileName',
      'snapshotId',
      'value',
      dataFormatter,
    )
  }, [reports, dataFormatter, envId, pageId])

  const chartSeries = useMemo<EChartsOption['series']>(() => {
    if (!data) {
      return []
    }

    const markLine: MarkLineOption = {
      data: [
        {
          type: 'average',
          name: 'average',
          label: {
            position: 'end',
            formatter: (data) => formatter(data.value as number),
          },
        },
        [
          {
            symbol: 'none',
            x: '90%',
            yAxis: 'max',
          },
          {
            symbol: 'circle',
            label: {
              position: 'start',
              formatter: (data) => `Max: ${formatter(data.value as number)}`,
            },
            type: 'max',
            name: 'max',
          },
        ],
        [
          {
            symbol: 'none',
            x: '90%',
            yAxis: 'min',
          },
          {
            symbol: 'circle',
            label: {
              position: 'start',
              formatter: (data) => `Min: ${formatter(data.value as number)}`,
            },
            type: 'min',
            name: 'min',
          },
        ],
      ],
    }

    return Object.entries(data).map(([key, value]) => ({
      type: 'line',
      name: key,
      smooth: true,
      data: value as [string, number][],
      markLine: value.length > 1 ? markLine : undefined,
    }))
  }, [data, formatter])

  const tooltipFormatter = useCallback(
    (_params: TooltipRendererParam) => {
      const params = Array.isArray(_params) ? _params : [_params]

      if (!project || !params.length || !groupData) {
        return ''
      }

      const items = compact(
        params.map((param) => {
          const { seriesName, data, color } = param
          const [snapshotId] = data as [string]
          if (!seriesName || !snapshotId || !groupData[seriesName]) {
            return null
          }
          return { data: groupData[seriesName][snapshotId], color: color as string }
        }),
      )

      const node = (
        <SnapshotChartTooltip title={Metrics[measure].title} formatter={formatter} dataList={items} project={project} />
      )

      return renderTooltip('report-metrics', node)
    },
    [formatter, groupData, measure, project],
  )

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

  if (!project || !pages.length || !environments.length || !pageId || !envId || !pageProfiles) {
    return null
  }

  return (
    <Chart option={option} loading={!data} notMerge={true} hideBorder>
      <ChartHeader title="Metric History">
        <Space wrap>
          <MeasureSelector isFirst={true} metrics={Metrics} measure={measure} onChange={setMeasure} />
          <SingleSelector options={pages} id={pageId} onChange={handlePageSelect} />
          <SingleSelector
            options={environments}
            id={envId}
            onChange={handleEnvSelect}
            onRenderTitle={onRenderEnvTitle}
          />
          <SingleSelector options={pageProfiles} id={profileId} onChange={handleProfileSelect} />
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
})
