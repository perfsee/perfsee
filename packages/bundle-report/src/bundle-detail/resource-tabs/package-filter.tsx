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
import { ChoiceGroup, HoverCard, HoverCardType, IPlainCardProps, PrimaryButton, TextField } from '@fluentui/react'
import { FC, useCallback, useMemo, useState } from 'react'

import { Size, PackageInfo as RawPackage } from '@perfsee/shared'

import { FilteredIcon, PackageFilterGroupWrap, PackageFilterWrap, TableHeaderFilterIcon } from '../style'

export type Package = RawPackage & {
  base: Size | null
}

type Props = {
  packages: Package[]
  onChangePackages: (packages: Package[] | null) => void
}

export const PackageFilter: FC<Props> = ({ packages, onChangePackages }) => {
  const [searchText, setSearchText] = useState('')
  const [selectedChoice, setSelectedChoice] = useState('')

  const filterBySearchText = useCallback(
    (searchText: string) => {
      if (!searchText) {
        onChangePackages(null)
      } else {
        const filterd = packages.filter((pkg) => pkg.name.includes(searchText))
        onChangePackages(filterd)
      }
    },
    [onChangePackages, packages],
  )

  const filterByGroup = useCallback(
    (group: string) => {
      if (!group) {
        onChangePackages(null)
      } else {
        const filterd = packages.filter(({ name }) => name.startsWith(`${group}/`))
        onChangePackages(filterd)
      }
    },
    [onChangePackages, packages],
  )

  const onChangeSearch = useCallback(
    (_: any, newValue?: string) => {
      const text = newValue?.trim() ?? ''
      setSearchText(text)
      setSelectedChoice('')
      filterBySearchText(text)
    },
    [filterBySearchText],
  )

  const onChangeGroup = useCallback(
    (_: any, choice?: { key: string }) => {
      const key = choice?.key ?? ''
      setSelectedChoice(key)
      setSearchText('')
      filterByGroup(key)
    },
    [filterByGroup],
  )

  const resetSearch = useCallback(() => {
    setSearchText('')
    setSelectedChoice('')
    onChangePackages(null)
  }, [onChangePackages])

  const prefixOptions = useMemo(() => {
    const prefixSet = new Set<string>()
    packages.forEach(({ name }) => {
      if (name.includes('/')) {
        const prefix = name.split('/')[0]
        prefixSet.add(prefix)
      }
    })

    return [...prefixSet].map((prefix) => ({ key: prefix, text: `${prefix}/*` }))
  }, [packages])

  const hoverContent = useMemo(
    () => (
      <PackageFilterWrap>
        <TextField label="Search" value={searchText} placeholder="Not support regex" onChange={onChangeSearch} />
        <PackageFilterGroupWrap>
          <ChoiceGroup
            options={prefixOptions}
            selectedKey={selectedChoice}
            label="Search Group"
            styles={{ flexContainer: { maxHeight: '200px', overflow: 'auto' } }}
            onChange={onChangeGroup}
          />
        </PackageFilterGroupWrap>
        <PrimaryButton text="Reset" onClick={resetSearch} />
      </PackageFilterWrap>
    ),
    [onChangeGroup, onChangeSearch, prefixOptions, resetSearch, searchText, selectedChoice],
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
        {searchText || selectedChoice ? <FilteredIcon /> : <FilterOutlined />}
      </HoverCard>
    </TableHeaderFilterIcon>
  )
}
