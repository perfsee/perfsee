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

import { IconButton, IIconProps, SelectionMode, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { stringifyUrl } from 'query-string'
import { useEffect, useMemo, useState, memo, useCallback } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'

import { Select, Space, Table, TableColumnProps, getScoreColor } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { PageSchema, useGenerateProjectRoute } from '@perfsee/platform/modules/shared'
import { LighthouseScoreType } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { PropertyModule } from '../../shared'

import { BarChart } from './components/barchart'
import { LoadMore } from './components/load-more'
import { SnapshotReport, StatisticsModule } from './module'
import { ChartPartHeader, ChartPartWrap, tableHeaderStyles } from './style'

type PageMetricsSchema = {
  page: PageSchema
  reports: SnapshotReport[] | null | undefined
}

const formatMillisecond = (v: number) => {
  const { value, unit } = formatTime(v)
  return `${value}${unit}`
}

const detailIconProps: IIconProps = {
  iconName: 'DoubleRightOutlined',
}

const BARCHART_LENGTH = 15
const SnapshotsMetricsBarChart = memo<{
  title: string
  reports: PageMetricsSchema['reports']
  propertyName: string
  valueFormatter?: (value: number) => string
  getColor?: (value: number) => string
  maxValue?: number
}>(({ title, reports, propertyName, valueFormatter = (value) => value.toString(), getColor, maxValue }) => {
  const urlFactory = useGenerateProjectRoute()
  const onRenderId = useCallback(
    (id: number) => {
      return (
        <Link
          to={urlFactory(pathFactory.project.lab.report, {
            reportId: id,
            tabName: 'overview',
          })}
        >
          Report #{id}
        </Link>
      )
    },
    [urlFactory],
  )

  return (
    <BarChart
      title={title}
      items={(reports ?? []).map((report) => {
        const value = report.metrics[propertyName]
        return {
          type: !value ? 'failed' : 'success',
          value,
          id: report.id,
          date: report.createdAt,
        }
      })}
      minLength={BARCHART_LENGTH}
      onRenderId={onRenderId}
      valueFormatter={valueFormatter}
      getColor={getColor}
      maxValue={maxValue}
      loading={!reports}
    />
  )
})

const detailColumn: TableColumnProps<PageMetricsSchema> = {
  key: 'detail',
  name: '',
  minWidth: 50,
  maxWidth: 50,
  onRender: () => {
    return (
      <TooltipHost key="detail" content="View Detail">
        <IconButton iconProps={detailIconProps} />
      </TooltipHost>
    )
  },
}

const pageColumns: TableColumnProps<PageMetricsSchema>[] = [
  {
    key: 'name',
    name: 'Page',
    minWidth: 220,
    onRender: ({ page }) => {
      return <a>{`${page.name}`}</a>
    },
  },
  {
    key: 'performance',
    name: 'Performance',
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ reports }) => {
      return (
        <SnapshotsMetricsBarChart
          title="Performance"
          reports={reports}
          propertyName={'performance'}
          maxValue={100}
          getColor={getScoreColor}
        />
      )
    },
  },
]

const webColumns: TableColumnProps<PageMetricsSchema>[] = ['FCP', 'LCP'].map((key) => {
  return {
    key: LighthouseScoreType[key],
    name: key,
    minWidth: 250,
    maxWidth: 250,
    onRender: ({ reports }) => {
      return (
        <SnapshotsMetricsBarChart
          title={key}
          valueFormatter={formatMillisecond}
          reports={reports}
          propertyName={LighthouseScoreType[key]}
        />
      )
    },
  }
})

export const SnapshotMetrics = memo(() => {
  const [loadMore, setLoadMore] = useState(false)
  const history = useHistory()
  const [{ aggregatedPages: aggregated }, dispatcher] = useModule(StatisticsModule)
  const [selectedEnvId, setEnvId] = useState<number>()
  const [selectedProfileId, setProfileId] = useState<number>()
  const generateProjectRoute = useGenerateProjectRoute()

  const [
    { loading: propertyLoading, pages, environments, profileMap, pageRelationMap },
    { fetchProperty, fetchPageRelation },
  ] = useModule(PropertyModule, {
    selector: (s) => ({
      loading: s.loading,
      pages: s.pages.filter((p) => !p.isCompetitor && !p.isTemp),
      environments: s.environments.filter((e) => !e.isCompetitor),
      profileMap: s.profileMap,
      pageRelationMap: s.pageRelationMap,
    }),
    dependencies: [],
  })

  const profiles = useMemo(() => Array.from(profileMap.values()), [profileMap])

  useEffect(() => {
    if (environments.length) {
      setEnvId(environments[0].id)
    }
  }, [environments])

  useEffect(() => {
    if (profiles.length) {
      setProfileId(profiles[0].id)
    }
  }, [profiles])

  useEffect(() => {
    fetchProperty()
    fetchPageRelation()
  }, [fetchProperty, fetchPageRelation])

  const selectedPages = useMemo(() => {
    if (pages.length && pageRelationMap.size && selectedEnvId && selectedProfileId) {
      return pages.filter((page) => {
        const relation = pageRelationMap.get(page.id)
        return !!(relation?.envIds.includes(selectedEnvId) && relation.profileIds.includes(selectedProfileId))
      })
    } else {
      return []
    }
  }, [pageRelationMap, pages, selectedEnvId, selectedProfileId])

  const queryPages = useMemo(() => {
    return loadMore ? selectedPages : selectedPages.slice(0, 5)
  }, [loadMore, selectedPages])

  useEffect(() => {
    if (queryPages.length > 0 && selectedEnvId && selectedProfileId) {
      dispatcher.getAggregatedPages(
        queryPages.map((page) => ({
          pageId: page.id,
          profileId: selectedProfileId,
          envId: selectedEnvId,
          length: BARCHART_LENGTH,
          from: null,
          to: null,
        })),
      )
    } else if (!propertyLoading && (!environments.length || !profiles.length)) {
      dispatcher.setEmptyPageSnapshots()
    }
  }, [dispatcher, selectedEnvId, selectedProfileId, queryPages, environments.length, profiles.length, propertyLoading])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher])

  const columns = useMemo(() => {
    return pageColumns.concat(webColumns).concat([detailColumn])
  }, [])

  const data = useMemo<PageMetricsSchema[] | null>(() => {
    if (!aggregated) {
      return null
    }

    const res = []
    for (const page of queryPages) {
      const reports = aggregated.find(
        (item) => item.pageId === page.id && item.envId === selectedEnvId && item.profileId === selectedProfileId,
      )?.reports
      res.push({
        page,
        reports: reports?.slice().sort((a, b) => a.id - b.id),
      })
    }

    return res
  }, [aggregated, queryPages, selectedEnvId, selectedProfileId])

  const handleRowClick = useCallback(
    (data: PageMetricsSchema) => {
      const startTime = data.reports?.[0]?.createdAt
      const pageId = data.page.id

      history.push(
        stringifyUrl({
          url: generateProjectRoute(pathFactory.project.statistics.snapshots, {}),
          query: {
            startTime: startTime ? dayjs(startTime).unix() : undefined,
            profileId: selectedProfileId,
            pageId,
            envId: selectedEnvId,
          },
        }),
      )
    },
    [generateProjectRoute, history, selectedEnvId, selectedProfileId],
  )

  const handleLoadMore = useCallback(() => {
    setLoadMore(true)
  }, [])

  return (
    <ChartPartWrap>
      <ChartPartHeader>
        <span>Performance Metric</span>
        <Space>
          <Select
            title="ENV"
            placeholder="Select env"
            options={environments.map((e) => ({ key: e.id, text: e.name }))}
            selectedKey={selectedEnvId}
            onKeyChange={setEnvId}
          />
          <Select
            title="Profile"
            placeholder="Select Profile"
            options={profiles.map((p) => ({ key: p.id, text: p.name }))}
            selectedKey={selectedProfileId}
            onKeyChange={setProfileId}
          />
        </Space>
      </ChartPartHeader>
      <Table
        items={data ?? []}
        columns={columns}
        selectionMode={SelectionMode.none}
        detailsListStyles={tableHeaderStyles}
        enableShimmer={!data}
        onRowClick={handleRowClick}
      />
      {!loadMore && selectedPages.length > 5 && <LoadMore onClick={handleLoadMore} />}
    </ChartPartWrap>
  )
})
