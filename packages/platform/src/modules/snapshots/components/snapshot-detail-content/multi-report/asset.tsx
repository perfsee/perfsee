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

import { FilterOutlined } from '@ant-design/icons'
import { IColumn, IDetailsRowProps, SelectionMode, Stack, Toggle } from '@fluentui/react'
import Fuse from 'fuse.js'
import { union } from 'lodash'
import { FC, MouseEvent, MouseEventHandler, useCallback, useMemo, useState } from 'react'

import { MultiSelector, useWideScreen, Table, ForeignLink } from '@perfsee/components'
import { NetworkRequest } from '@perfsee/flamechart'
import { onRenderRow as onRenderAsset } from '@perfsee/lab-report/pivot-content-asset'
import { AssetFilter } from '@perfsee/lab-report/pivot-content-asset/asset-filter'
import { ColumnKeys, DefaultColumns } from '@perfsee/lab-report/pivot-content-asset/filter-component/columns'
import { FilterTrigger } from '@perfsee/lab-report/pivot-content-asset/style'
import { getRequestDomain, getStartTime } from '@perfsee/lab-report/pivot-content-asset/utils'
import { WaterFall } from '@perfsee/lab-report/pivot-content-asset/waterfall'
import { PerformanceTabType, SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { useProject } from '@perfsee/platform/modules/shared'
import { RequestSchema } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { ConnectionByDomainTable } from './breakdown-tables'
import { AssetRowContainer, HeaderTitle } from './style'

type Props = {
  snapshots: SnapshotDetailType[]
}

const AssetRowItem: FC<{
  hovered: boolean
  children?: JSX.Element | null
  domain?: string
  onMouseEnter?: MouseEventHandler<HTMLDivElement>
  onMouseLeave?: MouseEventHandler<HTMLDivElement>
  requests: NetworkRequest[]
}> = ({ hovered, children, domain, onMouseEnter, onMouseLeave, requests }) => {
  const [opened, setOpened] = useState(false)
  const onClick = useCallback(() => {
    setOpened((opened) => !opened)
  }, [])

  const items = useMemo(() => {
    return requests.filter((r) => getRequestDomain(r) === domain)
  }, [requests, domain])

  const waterfallColumn = useMemo(() => {
    return [
      {
        key: ColumnKeys.Waterfall,
        name: 'WaterFall',
        minWidth: 200,
        maxWidth: 800,
        onRender: (item: RequestSchema, _i?: number, column?: IColumn) => {
          if (!items?.length) {
            return null
          }

          const firstRequest = items[0]
          const endTime = items.reduce((p, c) => Math.max(p, c.endTime), 0)

          return (
            <WaterFall
              width={column?.calculatedWidth ?? 200}
              firstTime={firstRequest.startTime}
              totalTime={endTime - firstRequest.startTime}
              request={item}
            />
          )
        },
        sorter: (a: RequestSchema, b: RequestSchema) => getStartTime(a) - getStartTime(b),
      },
    ]
  }, [items])

  const table = useMemo(() => {
    const columns = DefaultColumns.filter(
      (c) => !['#', 'Protocol', 'StartTime', 'Priority', 'Domain', 'Timing'].includes(c.name),
    )
      .map((c) => ({
        ...c,
        minWidth: Math.min(80, c.minWidth),
      }))
      .concat(waterfallColumn)

    return opened ? (
      <Table items={items} columns={columns} selectionMode={SelectionMode.none} onRenderRow={onRenderAsset} />
    ) : null
  }, [opened, items, waterfallColumn])

  const onTableClick = useCallback((ev: MouseEvent) => {
    ev.stopPropagation()
  }, [])

  return (
    <AssetRowContainer
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-domain={domain}
      hovered={hovered}
      onClick={onClick}
    >
      {children}
      <div onClick={onTableClick}>{table}</div>
    </AssetRowContainer>
  )
}

export const MultiContentRequests: FC<Props> = (props) => {
  useWideScreen()
  const { snapshots } = props

  const [reportIds, setReportIds] = useState(() => snapshots.map((snapshot) => snapshot.report.id))
  const reportSelectOptios = useMemo(() => {
    return snapshots.map((snapshot) => {
      const report = snapshot.report as NonNullable<SnapshotReportSchema>
      const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`
      return {
        id: report.id,
        name: `${report.page.name} - ${title}`,
      }
    })
  }, [snapshots])
  const onSelectChange = useCallback((ids: number[]) => {
    setReportIds(ids)
  }, [])

  const [hoveredDomain, setHoveredDomain] = useState<string | null>(null)
  const onMouseEnter = useCallback((ev: MouseEvent<HTMLDivElement>) => {
    const target = ev.currentTarget as HTMLDivElement
    const domain = target.dataset.domain as string
    setHoveredDomain(domain)
  }, [])
  const onMouseLeave = useCallback(() => {
    setHoveredDomain(null)
  }, [])
  const onRenderRow = useCallback(
    (props?: IDetailsRowProps, defaultRenderer?: (props?: IDetailsRowProps) => JSX.Element | null) => {
      return (
        <AssetRowItem
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          domain={props?.item.domain}
          hovered={hoveredDomain === props?.item.domain}
          requests={props?.item.requests || []}
        >
          {defaultRenderer?.(props) || null}
        </AssetRowItem>
      )
    },
    [hoveredDomain, onMouseEnter, onMouseLeave],
  )

  const project = useProject()

  const [group, setGroup] = useState(true)
  const onToggleChange = useCallback((_ev: any, checked?: boolean) => {
    setGroup(!!checked)
  }, [])

  const [search, setSearch] = useState('')

  const allDomains = useMemo(() => {
    return union(
      snapshots
        .filter((s) => reportIds.includes(s.report.id))
        .flatMap((s) => {
          const fuse = new Fuse(s.requests || [], {
            threshold: 0.4,
            keys: ['url'],
            includeScore: true,
          })

          const requests = search
            ? fuse
                .search(search)
                .filter((r) => {
                  return r.score !== undefined && r.score <= 0.4
                })
                .map((r) => r.item) || s.requests
            : s.requests
          return requests?.map(getRequestDomain) || []
        }),
    )
  }, [snapshots, reportIds, search])

  const assets = useMemo(() => {
    return snapshots
      .filter((s) => reportIds.includes(s.report.id))
      .map((snapshot, i) => {
        const report = snapshot.report as NonNullable<SnapshotReportSchema>
        const title = report.snapshot.title ?? `Snapshot #${report.snapshot.id}`
        const link = project
          ? pathFactory.project.lab.report({
              projectId: project.id,
              reportId: report.id,
              tabName: PerformanceTabType.Requests,
            })
          : undefined

        const fuse = new Fuse(snapshot.requests || [], {
          threshold: 0.4,
          keys: ['url'],
          includeScore: true,
        })

        const requests = search
          ? fuse
              .search(search)
              .filter((r) => {
                return r.score !== undefined && r.score <= 0.4
              })
              .map((r) => r.item) || snapshot.requests
          : snapshot.requests

        if (!group) {
          const waterfallColumn = [
            {
              key: ColumnKeys.Waterfall,
              name: 'WaterFall',
              minWidth: 200,
              maxWidth: 800,
              onRender: (item: RequestSchema, _i?: number, column?: IColumn) => {
                if (!requests?.length) {
                  return null
                }

                const firstRequest = requests[0]
                const endTime = requests.reduce((p, c) => Math.max(p, c.endTime), 0)

                return (
                  <WaterFall
                    width={column?.calculatedWidth ?? 200}
                    firstTime={firstRequest.startTime}
                    totalTime={endTime - firstRequest.startTime}
                    request={item}
                  />
                )
              },
              sorter: (a: RequestSchema, b: RequestSchema) => getStartTime(a) - getStartTime(b),
            },
          ]
          const columns = DefaultColumns.filter(
            (c) => !['#', 'Protocol', 'StartTime', 'Priority', 'Domain', 'Timing'].includes(c.name),
          )
            .map((c) => ({
              ...c,
              minWidth: Math.min(80, c.minWidth),
            }))
            .concat(waterfallColumn)

          return (
            <div key={snapshot.report.id}>
              <ForeignLink href={link}>
                {i + 1}.{report.page.name} - {title}
              </ForeignLink>
              <Table
                items={requests || []}
                columns={columns}
                selectionMode={SelectionMode.none}
                onRenderRow={onRenderAsset}
              />
            </div>
          )
        }

        return (
          <div key={snapshot.report.id}>
            <ForeignLink href={link}>
              {i + 1}.{report.page.name} - {title}
            </ForeignLink>
            <ConnectionByDomainTable
              requests={requests || []}
              domains={allDomains}
              onRenderRow={onRenderRow}
              reportId={snapshot.report.id}
            />
          </div>
        )
      })
  }, [allDomains, reportIds, snapshots, search, onRenderRow, project, group])

  return (
    <Stack tokens={{ childrenGap: 10, padding: '8px' }} styles={{ root: { overflowX: 'auto' } }}>
      <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <HeaderTitle>Selected Reports</HeaderTitle>
          <MultiSelector options={reportSelectOptios} ids={reportIds} onSelectChange={onSelectChange} maxWidth={500} />
        </Stack>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <AssetFilter title="Search url" searchText={search} onChangeSearchText={setSearch}>
            <FilterTrigger>
              <FilterOutlined />
              Search
            </FilterTrigger>
          </AssetFilter>
          <Toggle
            label="Group By Domain"
            defaultChecked
            inlineLabel
            onText="On"
            offText="Off"
            onChange={onToggleChange}
            styles={{ root: { marginBottom: 0 }, label: { fontSize: 15 } }}
          />
        </Stack>
      </Stack>
      <Stack horizontal>{assets}</Stack>
    </Stack>
  )
}
