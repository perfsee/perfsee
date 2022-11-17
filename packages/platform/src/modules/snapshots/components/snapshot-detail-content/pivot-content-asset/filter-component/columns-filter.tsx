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

import { CheckOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import { Stack, IPlainCardProps, HoverCard, HoverCardType } from '@fluentui/react'
import { capitalize } from 'lodash'
import { FC, useCallback, useMemo, MouseEvent } from 'react'

import { SelectionColumn, FilterTrigger } from '../style'

import { ColumnKeys, getColumnConfig } from './columns'

export type ColumnsProps = {
  columnKeys: ColumnKeys[]
  filteredColumnKeys?: Set<string>
  onFilterColumns: (columns: Set<string>) => void
}

export const CustomColumns: FC<ColumnsProps> = ({ columnKeys, filteredColumnKeys, onFilterColumns }) => {
  const toggleSelect = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!e.target) {
        return
      }
      const key = (e.target as HTMLDivElement).dataset.type! as ColumnKeys
      if (getColumnConfig(key).disable) {
        return
      }
      const columns = new Set(filteredColumnKeys)
      columns.has(key) ? columns.delete(key) : columns.add(key)
      onFilterColumns(columns)
    },
    [filteredColumnKeys, onFilterColumns],
  )

  const hoverContent = useMemo(() => {
    if (!filteredColumnKeys) {
      return null
    }

    return (
      <Stack styles={{ root: { width: '160px' } }} tokens={{ childrenGap: 4, padding: '8px 12px' }}>
        {columnKeys.map((key) => {
          return (
            <SelectionColumn
              disabled={getColumnConfig(key).disable}
              selected={filteredColumnKeys.has(key)}
              onClick={toggleSelect}
              data-type={key}
              key={key}
            >
              <CheckOutlined />
              {capitalize(key)}
            </SelectionColumn>
          )
        })}
      </Stack>
    )
  }, [columnKeys, filteredColumnKeys, toggleSelect])

  const filterCardProps = useMemo<IPlainCardProps>(
    () => ({
      onRenderPlainCard: () => {
        return hoverContent
      },
      calloutProps: {
        isBeakVisible: true,
      },
    }),
    [hoverContent],
  )

  return (
    <HoverCard type={HoverCardType.plain} cardOpenDelay={100} plainCardProps={filterCardProps}>
      <FilterTrigger>
        <MenuUnfoldOutlined />
        Custom columns
      </FilterTrigger>
    </HoverCard>
  )
}
