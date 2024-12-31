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

import { SelectOutlined } from '@ant-design/icons'
import { IconButton, IIconProps, SelectionMode, Stack, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { groupBy } from 'lodash'
import { stringifyUrl } from 'query-string'
import { useEffect, useMemo, useState, memo, useCallback } from 'react'
import { useHistory } from 'react-router'
import { Link } from 'react-router-dom'

import { ForeignLink, Select, Space, Table, TableColumnProps, getScoreColor } from '@perfsee/components'
import { formatTime } from '@perfsee/platform/common'
import { PageSchema, useProjectRouteGenerator } from '@perfsee/platform/modules/shared'
import { LighthouseScoreType } from '@perfsee/shared'
import { pathFactory, staticPath } from '@perfsee/shared/routes'

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
  const urlFactory = useProjectRouteGenerator()
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
  const generateProjectRoute = useProjectRouteGenerator()

  const [{ loading: propertyLoading, environments, profileMap }, { fetchProperty, fetchPageRelation }] = useModule(
    PropertyModule,
    {
      selector: (s) => ({
        loading: s.loading,
        environments: s.environments,
        profileMap: s.profileMap,
        pageRelationMap: s.pageRelationMap,
      }),
      dependencies: [],
    },
  )

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

  useEffect(() => {
    if (selectedEnvId && selectedProfileId) {
      dispatcher.getAggregatedPages({
        profileId: selectedProfileId,
        envId: selectedEnvId,
        length: BARCHART_LENGTH,
        from: null,
        to: null,
        excludeTemp: true,
        excludeCompetitor: true,
      })
    } else if (
      // not in loading property and have calculated no pages in current env & profile
      !propertyLoading &&
      (!environments.length || !profiles.length)
    ) {
      dispatcher.setEmptyPageSnapshots()
    }
  }, [dispatcher, selectedEnvId, selectedProfileId, environments.length, profiles.length, propertyLoading])

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

    const reports = groupBy(
      aggregated.find((item) => item.envId === selectedEnvId && item.profileId === selectedProfileId)?.reports || [],
      'page.id',
    )

    if (Object.keys(reports)?.length) {
      return Object.values(reports).map((values) => {
        return {
          page: values[0].page as any,
          reports: values?.slice().sort((a, b) => a.id - b.id),
        }
      })
    }

    return []
  }, [aggregated, selectedEnvId, selectedProfileId])

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
        items={loadMore ? data ?? [] : (data ?? []).slice(0, 5)}
        columns={columns}
        selectionMode={SelectionMode.none}
        detailsListStyles={tableHeaderStyles}
        enableShimmer={!data}
        onRowClick={handleRowClick}
      />
      {!data?.length ? (
        <Stack horizontalAlign="center">
          <ForeignLink href={staticPath.docs.home + '/lab/get-started'}>
            See how to take a snapshot <SelectOutlined />
          </ForeignLink>
        </Stack>
      ) : null}
      {!loadMore && (data ?? []).length > 5 && <LoadMore onClick={handleLoadMore} />}
    </ChartPartWrap>
  )
})
