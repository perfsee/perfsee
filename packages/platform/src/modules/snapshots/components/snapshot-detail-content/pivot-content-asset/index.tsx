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

import {
  DetailsRow,
  SelectionMode,
  IDetailsListProps,
  IDetailsRowStyles,
  IDetailsRowProps,
  IColumn,
  IGroup,
} from '@fluentui/react'
import { groupBy } from 'lodash'
import { useState, useCallback, useMemo } from 'react'

import { Table, useWideScreen } from '@perfsee/components'
import { lighten, SharedColors } from '@perfsee/dls'
import { RequestSchema } from '@perfsee/shared'

import { SnapshotDetailType } from '../../../snapshot-type'

import { ColumnKeys, DefaultColumns, getColumnConfig } from './filter-component/columns'
import { groupByDomain, GroupByKey } from './filter-component/group-by-filter'
import { RequestFilter } from './requests-filter'
import { TableExtraInfo } from './table-extra-info'
import { getStartTime } from './utils'
import { WaterFall } from './waterfall'

const DetailRowItem = (props: IDetailsRowProps) => {
  const [opened, setOpened] = useState<boolean>()

  const customStyles: Partial<IDetailsRowStyles> = useMemo(
    () => ({
      cell: {
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        backgroundColor: opened ? lighten(SharedColors.gray30, 0.9) : undefined,
      },
    }),
    [opened],
  )

  const onClick = useCallback(() => {
    setOpened((opened) => !opened)
  }, [])

  return (
    <>
      <DetailsRow {...props} styles={customStyles} onClick={onClick} />
      {opened && <TableExtraInfo item={props.item as RequestSchema} />}
    </>
  )
}

const onRenderRow: IDetailsListProps['onRenderRow'] = (props) => {
  if (props) {
    return <DetailRowItem {...props} />
  }
  return null
}

type Props = {
  snapshot: SnapshotDetailType
}

const defaultKeys = Object.values(ColumnKeys).filter((key) => getColumnConfig(key).defaultShown)

export const AssetContent = ({ snapshot: snapshotDetail }: Props) => {
  useWideScreen()
  const [searchedList, setSearchedList] = useState<RequestSchema[] | undefined>()
  const [filterColumnKeys, setFilterColumnKeys] = useState<Set<string>>(new Set(defaultKeys))
  const [groupByKey, setGroupBy] = useState<GroupByKey>(GroupByKey.None)

  const onFilter = useCallback((list: RequestSchema[]) => {
    setSearchedList(list)
  }, [])

  const waterfallColumn = useMemo(() => {
    return [
      {
        key: ColumnKeys.Waterfall,
        name: 'WaterFall',
        minWidth: 260,
        maxWidth: 800,
        onRender: (item: RequestSchema, _i?: number, column?: IColumn) => {
          if (!searchedList?.length) {
            return null
          }

          const firstRequest = searchedList[0]
          const endTime = searchedList.reduce((p, c) => Math.max(p, c.endTime), 0)

          return (
            <WaterFall
              width={column?.calculatedWidth ?? 260}
              firstTime={firstRequest.startTime}
              totalTime={endTime - firstRequest.startTime}
              request={item}
            />
          )
        },
        sorter: (a: RequestSchema, b: RequestSchema) => getStartTime(a) - getStartTime(b),
      },
    ]
  }, [searchedList])

  const columns = useMemo(() => {
    return DefaultColumns.concat(waterfallColumn).filter((c) => filterColumnKeys.has(c.key))
  }, [filterColumnKeys, waterfallColumn])

  const { groups, items } = useMemo(() => {
    if (groupByKey === GroupByKey.None) {
      return { groups: undefined, items: searchedList }
    }

    const grouped = groupBy(searchedList, groupByKey === GroupByKey.Domain ? groupByDomain : groupByKey)

    const items: RequestSchema[] = []
    const groups: IGroup[] = []

    Object.entries(grouped).forEach(([key, assets], i) => {
      groups.push({
        key: key,
        name: key,
        startIndex: items.length,
        count: assets.length,
        isCollapsed: i !== 0,
      })
      items.push(...assets)
    })

    return {
      groups,
      items,
    }
  }, [groupByKey, searchedList])

  return (
    <div style={{ maxWidth: 'calc(100vw - 160px)' }}>
      <RequestFilter
        requests={snapshotDetail.requests ?? []}
        metricScores={snapshotDetail.metricScores ?? []}
        onChange={onFilter}
        onFilterColumns={setFilterColumnKeys}
        filteredColumnKeys={filterColumnKeys}
        columnKeys={Object.values(ColumnKeys)}
        groupBy={groupByKey}
        onGroupByChange={setGroupBy}
      />
      <Table
        items={items ?? []}
        groups={groups}
        enableShimmer={!searchedList}
        selectionMode={SelectionMode.none}
        columns={columns}
        onRenderRow={onRenderRow}
      />
    </div>
  )
}
