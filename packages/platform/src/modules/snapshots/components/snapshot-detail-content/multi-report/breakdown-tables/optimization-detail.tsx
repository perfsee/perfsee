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

import { InfoCircleOutlined } from '@ant-design/icons'
import { SelectionMode, TooltipHost } from '@fluentui/react'
import { FC, useMemo } from 'react'

import {
  onRenderVerticalLineRow,
  TableColumnProps,
  Table,
  IconWithTips,
  HeaderWithVerticalLineStyles,
} from '@perfsee/components'
import { ChartHeaderTitle } from '@perfsee/components/chart/style'
import { needOptimizeCache, needOptimizeCompression } from '@perfsee/lab-report/pivot-content-asset/utils'
import { RequestType, SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { RequestSchema } from '@perfsee/shared'

type ItemType = {
  name: string
  title: string
  noGzipRequests: string[]
  noCacheRequests: string[]
  gzip: number
  cache: number
}
const defaultColumns = [
  {
    key: 'index',
    name: '#',
    fieldName: 'index',
    minWidth: 10,
    maxWidth: 20,
  },
  {
    key: 'name',
    name: 'Name',
    minWidth: 100,
    maxWidth: 160,
    sorter: (a, b) => a.name.localeCompare(b.name),
    onRender: (item) => (
      <TooltipHost content={item.title}>
        <b>{item.name}</b>
      </TooltipHost>
    ),
  },
  {
    key: 'gzip',
    name: 'Gzip',
    minWidth: 100,
    maxWidth: 120,
    comparator: (a, b) => b.gzip - a.gzip,
    onRender: (item) => {
      const icon = <InfoCircleOutlined style={{ marginLeft: '4px' }} />
      const content = item.noGzipRequests.map((url, i) => (
        <span key={`${i}-${url}`}>
          <b>{i + 1}.</b>
          {url}
        </span>
      ))
      return (
        <>
          {(item.gzip * 100).toFixed(2) + '%'}
          {content.length ? <IconWithTips icon={icon} content={<>No Gzip Requests: {content}</>} /> : null}
        </>
      )
    },
  },
  {
    key: 'cache',
    name: 'Cache Static',
    minWidth: 100,
    maxWidth: 120,
    comparator: (a, b) => b.cache - a.cache,
    onRender: (item) => {
      const icon = <InfoCircleOutlined style={{ marginLeft: '4px' }} />
      const content = item.noCacheRequests.map((url, i) => (
        <span key={`${i}-${url}`}>
          <b>{i + 1}.</b>
          {url}
          <br />
        </span>
      ))
      return (
        <>
          {(item.cache * 100).toFixed(2) + '%'}
          {content.length ? (
            <IconWithTips
              icon={icon}
              content={
                <>
                  No Cache Requests:
                  <br /> {content}
                </>
              }
            />
          ) : null}
        </>
      )
    },
  },
] as TableColumnProps<ItemType>[]

type Props = {
  snapshots: SnapshotDetailType[]
}

export const OptimizationTable: FC<Props> = ({ snapshots }) => {
  const items = useMemo(() => {
    return snapshots.map((snapshot, i) => {
      const report = snapshot.report as NonNullable<SnapshotReportSchema>
      const requests = snapshot.requests as RequestSchema[]

      let needGzipRequestsCount = 0
      let needCacheRequestsCount = 0
      const noGzip: string[] = []
      const noCache: string[] = []

      requests.forEach((req) => {
        if ([RequestType.Image, RequestType.Media, RequestType.Font].every((v) => v !== req.type)) {
          needGzipRequestsCount++
          if (needOptimizeCompression(req)) {
            noGzip.push(req.url)
          }
        }

        if (req.method === 'GET' && req.type !== RequestType.Document && req.status === '200') {
          needCacheRequestsCount++
          if (needOptimizeCache(req)) {
            noCache.push(req.url)
          }
        }
      })

      return {
        index: i + 1,
        title: report.snapshot.title ?? `Snapshot #${report.snapshot.id}`,
        gzip: (needGzipRequestsCount - noGzip.length) / needGzipRequestsCount,
        cache: (needCacheRequestsCount - noCache.length) / needCacheRequestsCount,
        noGzipRequests: noGzip,
        noCacheRequests: noCache,
        name: report.page.name,
      }
    })
  }, [snapshots])

  return (
    <div>
      <ChartHeaderTitle>Optimization Detail</ChartHeaderTitle>
      <Table
        columns={defaultColumns}
        detailsListStyles={HeaderWithVerticalLineStyles}
        items={items}
        selectionMode={SelectionMode.none}
        onRenderRow={onRenderVerticalLineRow}
      />
    </div>
  )
}
