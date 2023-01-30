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

import { FileAddOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Stack, SelectionMode, IGroup, TooltipHost } from '@fluentui/react'
import { groupBy } from 'lodash'
import { FC, useMemo, useState } from 'react'

import { TableColumnProps, Table, TooltipWithEllipsis } from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'
import { AssetTypeEnum, AssetInfo, EntryDiff } from '@perfsee/shared'

import { ColoredSize, TransferTime } from '../components'
import { TableHeaderFilterWrap } from '../style'

import { AssetFilter } from './asset-filter'
import { onAssetTableRenderRow } from './assets-table-row'

type AssetRow = AssetInfo & {
  isNew: boolean
}

interface Props {
  diff: EntryDiff
}
export const AssetsTable: FC<Props> = ({ diff }) => {
  const { current: currentAllAssets, baseline: baselineAssets } = diff.assetsDiff

  const [searchText, setSearchText] = useState<string>('')

  const currentAssets = useMemo(
    () => currentAllAssets.filter((asset) => asset.name.includes(searchText)),
    [currentAllAssets, searchText],
  )

  const { groups, items } = useMemo(() => {
    const grouped = groupBy(currentAssets, 'type')

    const items: AssetRow[] = []
    const groups: IGroup[] = []

    Object.entries(grouped).forEach(([type, assets]) => {
      groups.push({
        key: type,
        name: type,
        startIndex: items.length,
        count: assets.length,
        isCollapsed: type !== AssetTypeEnum.Js,
      })
      items.push(
        ...assets.map((asset) => ({
          ...asset,
          isNew: !baselineAssets?.find((a) => a.name === asset.name),
        })),
      )
    })

    return {
      groups,
      items,
    }
  }, [baselineAssets, currentAssets])

  const columns: TableColumnProps<AssetRow>[] = useMemo(
    () => [
      {
        key: 'name',
        name: 'Name',
        minWidth: 200,
        maxWidth: 540,
        onRenderHeader: () => {
          return (
            <TableHeaderFilterWrap>
              <span>Name</span>
              <AssetFilter searchText={searchText} onChangeSearchText={setSearchText} />
            </TableHeaderFilterWrap>
          )
        },
        onRender: (asset) => <TooltipWithEllipsis content={asset.name} />,
      },
      {
        key: 'new',
        name: 'New',
        minWidth: 60,
        maxWidth: 100,
        onRender: (asset) => {
          if (asset.isNew) {
            return <FileAddOutlined style={{ color: SharedColors.red10 }} />
          }

          return null
        },
        sorter: (a) => (a.isNew ? 1 : -1),
      },
      {
        key: 'type',
        name: 'Type',
        minWidth: 60,
        maxWidth: 100,
        onRender: (asset) => {
          if (asset.intermediate) {
            return <span style={{ color: SharedColors.gray10 }}>Intermediate</span>
          }

          if (asset.initial) {
            return <span style={{ color: SharedColors.red10 }}>Initial</span>
          }

          return <span style={{ color: SharedColors.green10 }}>Async</span>
        },
        sorter: (a) => (a.initial ? 1 : -1),
      },
      {
        key: 'size',
        name: 'Size',
        minWidth: 60,
        maxWidth: 100,
        onRender: (asset) => <ColoredSize size={asset.size} />,
        isSorted: true,
        isSortedDescending: true,
        sorter: (a, b) => a.size.raw - b.size.raw,
      },
      {
        key: 'download',
        name: 'Transfer Time',
        minWidth: 60,
        maxWidth: 100,
        onRender: (asset) => {
          return <TransferTime size={asset.size.gzip} />
        },
        onRenderHeader: () => {
          return (
            <TooltipHost content="AssetInfo network transfer time, calculated with ideal downloading speed with gzipped size.">
              <span>
                Time <QuestionCircleOutlined />
              </span>
            </TooltipHost>
          )
        },
        sorter: (a, b) => a.size.raw - b.size.raw,
      },
      {
        key: 'packages',
        name: 'Included packages',
        minWidth: 130,
        maxWidth: 130,
        onRender: (asset) => {
          if (!asset.packages?.length) {
            return null
          }

          return <span>count: {asset.packages.length}</span>
        },
        sorter: (a, b) => (a.packages?.length ?? 0) - (b.packages?.length ?? 0),
      },
    ],
    [searchText],
  )

  return (
    <Stack>
      <Table
        items={items}
        groups={groups.length > 0 ? groups : undefined}
        selectionMode={SelectionMode.none}
        columns={columns}
        disableVirtualization={items.length < 100}
        onRenderRow={onAssetTableRenderRow}
      />
    </Stack>
  )
}
