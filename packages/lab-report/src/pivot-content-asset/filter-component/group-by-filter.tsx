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

import { CheckOutlined, GroupOutlined } from '@ant-design/icons'
import { Stack, IPlainCardProps, HoverCard, HoverCardType } from '@fluentui/react'
import { capitalize } from 'lodash'
import { FC, useCallback, useMemo, MouseEvent } from 'react'

import { RequestSchema } from '@perfsee/shared'

import { SelectionColumn, FilterTrigger } from '../style'

export enum GroupByKey {
  None = 'none',
  Domain = 'domain',
  Type = 'type',
  Status = 'status',
}

export type GroupByProps = {
  groupBy: GroupByKey
  onGroupByChange: (key: GroupByKey) => void
}

export const GroupBy: FC<GroupByProps> = ({ groupBy, onGroupByChange }) => {
  const toggleSelect = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!e.target) {
        return
      }
      const key = (e.target as HTMLDivElement).dataset.type! as GroupByKey

      onGroupByChange(key)
    },
    [onGroupByChange],
  )

  const hoverContent = useMemo(() => {
    return (
      <Stack styles={{ root: { width: '160px' } }} tokens={{ childrenGap: 4, padding: '8px 12px' }}>
        {Object.values(GroupByKey).map((value) => {
          return (
            <SelectionColumn selected={value === groupBy} onClick={toggleSelect} data-type={value} key={value}>
              <CheckOutlined />
              {capitalize(value)}
            </SelectionColumn>
          )
        })}
      </Stack>
    )
  }, [groupBy, toggleSelect])

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
        <GroupOutlined />
        Group by
      </FilterTrigger>
    </HoverCard>
  )
}

export function groupByDomain(asset: RequestSchema) {
  return asset.url.indexOf('data:') === 0 ? 'inlined' : new URL(asset.url).host
}
