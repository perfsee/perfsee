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
import { Stack } from '@fluentui/react'
import Fuse from 'fuse.js'
import { debounce } from 'lodash'
import { useState, useCallback, useMemo, useEffect } from 'react'

import { AssetFilter } from '@perfsee/bundle-report/bundle-detail/resource-tabs/asset-filter'
import { MetricScoreSchema, RequestSchema } from '@perfsee/shared'

import { CriticalTimeSelector } from './critical-time-selector'
import { ColumnsProps, CustomColumns } from './filter-component/columns-filter'
import { GroupBy, GroupByProps } from './filter-component/group-by-filter'
import { FilterTrigger } from './style'
import { getStartTime, needOptimize } from './utils'

type Props = {
  onChange: (list: RequestSchema[]) => void
  requests: RequestSchema[]
  metricScores: MetricScoreSchema[]
} & ColumnsProps &
  GroupByProps

export const RequestFilter = (props: Props) => {
  const {
    groupBy,
    onGroupByChange,
    onChange,
    requests,
    metricScores,
    onFilterColumns,
    columnKeys,
    filteredColumnKeys,
  } = props

  const [query, setQuery] = useState<string>('')
  const [selectedTime, setTime] = useState<Record<string, number | undefined>>({})
  const [optimizeChecked, setChecked] = useState<boolean>(false)
  const [requestList, setRequests] = useState<RequestSchema[]>(requests)

  const fuse = useMemo(() => {
    return new Fuse(requestList, {
      threshold: 0.4,
      keys: ['url'],
      includeScore: true,
    })
  }, [requestList])

  const optimizeList = useMemo(() => {
    return requests.filter((v) => needOptimize(v))
  }, [requests])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const delayedQuery = useCallback(
    debounce((q: string) => {
      const result = fuse.search<RequestSchema>(q)

      if (!q || !result) {
        onChange(requestList)
      } else {
        // sometimes fuse will filter out some results exceed the threshold
        onChange(result.filter((i) => i.score !== undefined && i.score <= 0.4).map((i) => i.item))
      }
    }, 500),
    [fuse, requestList],
  )

  useEffect(() => {
    let list = requests
    if (optimizeChecked) {
      list = optimizeList
    }

    const times = Object.values(selectedTime).filter((v) => !!v) as number[]

    if (times.length) {
      if (times.length === 1) {
        list = list.filter((item) => {
          return getStartTime(item) <= times[0]
        })
      } else {
        const min = Math.min(times[0], times[1])
        const max = Math.max(times[0], times[1])

        list = list.filter((item) => {
          const startTime = getStartTime(item)
          return startTime >= min && startTime <= max
        })
      }
    }

    setRequests(list)
  }, [optimizeChecked, selectedTime, requests, optimizeList])

  useEffect(() => {
    if (!query) {
      onChange(requestList)
    }
  }, [onChange, requestList, query])

  const onOptimizeCheck = useCallback((checked: boolean) => {
    setChecked(checked)
    setQuery('')
  }, [])

  const onSearchChange = useCallback(
    (value?: string) => {
      delayedQuery(value ?? '')
      setQuery(value ?? '')
    },
    [delayedQuery],
  )

  const onCriticalTimeChange = useCallback((time: Record<string, number | undefined>) => {
    setTime(time)
    setQuery('')
  }, [])

  return (
    <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
      <Stack horizontal verticalAlign="center" horizontalAlign="center">
        <CriticalTimeSelector
          optimizeCount={optimizeList.length}
          onOptimizeChange={onOptimizeCheck}
          selectedTime={selectedTime}
          metricScores={metricScores}
          onChange={onCriticalTimeChange}
        />
      </Stack>
      <Stack horizontal tokens={{ childrenGap: 4 }}>
        <AssetFilter title="Search url" searchText={query} onChangeSearchText={onSearchChange}>
          <FilterTrigger>
            <FilterOutlined />
            Search
          </FilterTrigger>
        </AssetFilter>
        <GroupBy groupBy={groupBy} onGroupByChange={onGroupByChange} />
        <CustomColumns
          columnKeys={columnKeys}
          filteredColumnKeys={filteredColumnKeys}
          onFilterColumns={onFilterColumns}
        />
      </Stack>
    </Stack>
  )
}
