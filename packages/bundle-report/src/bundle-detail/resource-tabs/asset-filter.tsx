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
import { HoverCard, HoverCardType, IPlainCardProps, PrimaryButton, Stack, TextField } from '@fluentui/react'
import { FC, useCallback, useMemo } from 'react'

import { Size, PackageInfo as RawPackage } from '@perfsee/shared'

import { FilteredIcon, TableHeaderFilterIcon } from '../style'

export type Package = RawPackage & {
  base: Size | null
}

type Props = {
  searchText: string
  onChangeSearchText: (searchText: string) => void
}

export const AssetFilter: FC<Props> = ({ searchText, onChangeSearchText }) => {
  const onChangeSearch = useCallback(
    (_: any, newValue?: string) => {
      const text = newValue?.trim() ?? ''
      onChangeSearchText(text)
    },
    [onChangeSearchText],
  )

  const resetSearch = useCallback(() => {
    onChangeSearchText('')
  }, [onChangeSearchText])

  const hoverContent = useMemo(
    () => (
      <Stack tokens={{ childrenGap: 10, padding: '10px' }}>
        <TextField label="Search" value={searchText} placeholder="Not support regex" onChange={onChangeSearch} />
        <PrimaryButton text="Reset" onClick={resetSearch} />
      </Stack>
    ),
    [onChangeSearch, resetSearch, searchText],
  )

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
    <TableHeaderFilterIcon>
      <HoverCard type={HoverCardType.plain} cardOpenDelay={100} plainCardProps={filterCardProps}>
        {searchText ? <FilteredIcon /> : <FilterOutlined />}
      </HoverCard>
    </TableHeaderFilterIcon>
  )
}
