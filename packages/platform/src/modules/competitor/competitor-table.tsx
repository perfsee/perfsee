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

import { SelectionMode, Stack, TooltipHost } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import {
  onRenderVerticalLineRow,
  TableColumnProps,
  Table,
  disabledVirtualization,
  IconWithTips,
  HeaderWithVerticalLineStyles,
  ForeignLink,
} from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { LighthouseScoreMetric, MetricType } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { PropertyModule, useProjectRouteGenerator } from '../shared'
import { PerformanceTabType } from '../snapshots/snapshot-type'

import { SnapshotReport } from './module'
import { evaluate, getMean, MetricKeys } from './utils'

const formatter = (v: number) => {
  const { value, unit } = formatTime(v)
  return `${value}${unit}`
}

const metricColumns = ['FCP', 'FMP', 'LCP', 'SI', 'TTI', 'TBT', 'WS'].map((key) => {
  return {
    key: key,
    name: key === 'WS' ? 'White Screen' : key,
    minWidth: 120,
    maxWidth: 130,
    comparator: (a, b) => {
      const aPayload = a[MetricType[key]]
      const bPayload = b[MetricType[key]]
      if (!aPayload?.sample.length || !bPayload?.sample.length) {
        return undefined
      }

      const bMean = getMean(bPayload.sample)
      const aMean = getMean(aPayload.sample)

      return aMean - bMean
    },
    onRender: (item) => {
      const payload = item[MetricType[key]]
      if (!payload || !payload.sample.length) {
        return '-'
      }
      const { mean, rme } = evaluate(payload.sample)
      return `${formatter(mean)} \xb1${rme.toFixed(1)}%`
    },
  } as TableColumnProps<AggregationItemSchema>
})

const tableColumns = [
  {
    key: 'name',
    name: 'Page',
    minWidth: 150,
    maxWidth: 300,
    sorter: (a, b) => a.pageName.localeCompare(b.pageName),
    onRender: (item) => {
      const count = (item[LighthouseScoreMetric.Performance].sample ?? item[LighthouseScoreMetric.Accessibility].sample)
        .length

      const content = (
        <span>
          Page: {item.pageName}
          <br />
          Environment: {item.envName}
          <br />
          {count} samples
        </span>
      )
      return (
        <TooltipHost content={content}>
          <b>{item.pageName}</b>
          <span>({count} samples)</span>
        </TooltipHost>
      )
    },
  },
  {
    key: 'performance',
    name: 'Performance',
    minWidth: 90,
    maxWidth: 100,
    comparator: (a, b) => {
      const aPayload = a[LighthouseScoreMetric.Performance]
      const bPayload = b[LighthouseScoreMetric.Performance]
      if (!aPayload || !bPayload) {
        return 0
      }
      const aMean = getMean(aPayload.sample)
      const bMean = getMean(bPayload.sample)
      return bMean - aMean
    },
    onRender: (item) => {
      const payload = item[LighthouseScoreMetric.Performance]
      if (!payload || !payload.sample.length) {
        return '-'
      }
      const { mean, rme } = evaluate(payload.sample)
      return `${mean.toFixed(1)} \xb1${rme.toFixed(1)}%`
    },
  },
  {
    key: 'accessibility',
    name: 'A11y',
    minWidth: 80,
    maxWidth: 100,
    comparator: (a, b) => {
      const aPayload = a[LighthouseScoreMetric.Accessibility]
      const bPayload = b[LighthouseScoreMetric.Accessibility]
      if (!aPayload || !bPayload) {
        return 0
      }
      const aMean = getMean(aPayload.sample)
      const bMean = getMean(bPayload.sample)
      return bMean - aMean
    },
    onRender: (item) => {
      const payload = item[LighthouseScoreMetric.Accessibility]
      if (!payload || !payload.sample.length) {
        return '-'
      }
      const { mean, rme } = evaluate(payload.sample)
      return `${mean.toFixed(1)} \xb1${rme.toFixed(1)}%`
    },
  },
  ...metricColumns,
] as TableColumnProps<AggregationItemSchema>[]

type ReportPayloadSchema = {
  pageName: string
  envName: string
  pageId: number
  snapshotReportId: number
}

type MetricValueSchema = { [x: string]: { sample: number[] } }
type AggregationItemSchema = MetricValueSchema & ReportPayloadSchema

type Props = {
  pageId: number
  reports: SnapshotReport[]
}

export const CompetitorTable = ({ reports, pageId }: Props) => {
  const { pageMap, envMap } = useModuleState(PropertyModule)
  const generateProjectRoute = useProjectRouteGenerator()

  const aggregationItems = useMemo(() => {
    if (!reports.length || !pageMap.size || !envMap.size) {
      return []
    }

    const metricValuesMap = new Map<string, MetricValueSchema>()
    const rawDataMap = new Map<string, ReportPayloadSchema>()

    reports.forEach((report) => {
      const key = `${report.page.name}-${report.profile.name}-${report.environment.name}`

      const data = rawDataMap.get(key)
      if (!data) {
        // It saves the latest data because the data is sort by creation time in descending order.
        const reportPayload = {
          pageName: report.page.name,
          envName: report.environment.name,
          pageId: report.page.id,
          snapshotReportId: report.id,
        }
        rawDataMap.set(key, reportPayload)
      }

      for (const metricKey of MetricKeys) {
        const payload = metricValuesMap.get(key) ?? {}
        const rawValue: number | string = report.metrics[metricKey]
        const value = typeof rawValue === 'number' ? rawValue : Number(rawValue)
        const lastSample = payload[metricKey]?.sample
        if (value) {
          if (lastSample) {
            lastSample.push(value)
          } else {
            metricValuesMap.set(key, { ...payload, [metricKey]: { sample: [value] } })
          }
        }
      }
    })

    const items: AggregationItemSchema[] = []

    metricValuesMap.forEach((v, key) => {
      const data = rawDataMap.get(key)!
      items.push({ ...v, ...data } as AggregationItemSchema)
    })

    // In order to put our page data at the top of array
    return items.sort((a, _b) => (a.pageId === pageId ? -1 : 1))
  }, [reports, envMap, pageMap, pageId])

  const reportIds = useMemo(() => {
    return aggregationItems.map((item) => item.snapshotReportId)
  }, [aggregationItems])

  if (!aggregationItems.length) {
    return null
  }

  const link = generateProjectRoute(
    pathFactory.project.competitor.report,
    { tabName: PerformanceTabType.Overview },
    { report_ids: reportIds.join(',') },
  )

  return (
    <Stack tokens={{ padding: '14px 0' }}>
      <Stack horizontal verticalAlign="center">
        <Link to={link} style={{ paddingLeft: '10px' }}>
          <TooltipHost content="This report uses the latest data in the above date range for comparison.">
            <b>Competitor Report</b>
          </TooltipHost>
        </Link>
        <IconWithTips
          marginLeft="4px"
          content={
            <span>
              {`"\xb1 xx%"`} means relative margin of error. It is calculated by dividing
              <ForeignLink style={{ margin: '0 8px' }} href="https://en.wikipedia.org/wiki/Margin_of_error">
                margin of error
              </ForeignLink>
              by the arithmetic mean.
            </span>
          }
        />
      </Stack>
      <Table
        items={aggregationItems}
        detailsListStyles={HeaderWithVerticalLineStyles}
        selectionMode={SelectionMode.none}
        columns={tableColumns}
        onShouldVirtualize={disabledVirtualization}
        onRenderRow={onRenderVerticalLineRow}
      />
    </Stack>
  )
}
