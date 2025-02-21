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

import { AppstoreOutlined, CheckOutlined, FileAddOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { Stack, SelectionMode, IGroup, TooltipHost } from '@fluentui/react'
import { groupBy } from 'lodash'
import { FC, MouseEvent, useCallback, useMemo, useRef, useState } from 'react'

import { TableColumnProps, Table, TooltipWithEllipsis, ForeignLink } from '@perfsee/components'
import { SharedColors, lighten } from '@perfsee/dls'
import { AssetTypeEnum, AssetInfo, EntryDiff, BundleAuditScore, ModuleTreeNode, assetsMatcher } from '@perfsee/shared'

import { ModuleItem } from '../../bundle-content/treeview'
import { ByteSizeWithDiff, TransferTime } from '../components'
import { TableHeaderFilterWrap, TraceIconWrap } from '../style'
import { ItemAudit } from '../types'

import { AssetFilter } from './asset-filter'
import { onAssetTableRenderRow } from './assets-table-row'
import { ContentModal } from './content-modal'
import { SizeDiffHoverCardHeader } from './style'
import { useAuditScore } from './use-audit-score'

export type AssetRow = AssetInfo & {
  isNew: boolean
  audits: ItemAudit[]
  exclusive: boolean
  baseline?: AssetInfo | null
}

interface Props {
  diff: EntryDiff
  hasMultipleEntries: boolean
  getAssetContent: (asset: AssetInfo) => Promise<ModuleTreeNode[]>
  onClickModule?: (item: ModuleItem) => void
  onClickSideEffects?: (item: ModuleItem) => void
}

export const AssetsTable: FC<Props> = ({
  diff,
  hasMultipleEntries,
  getAssetContent,
  onClickModule,
  onClickSideEffects,
}) => {
  const { current: currentAllAssets, baseline: baselineAssets } = diff.assetsDiff
  const { current: currentChunks } = diff.chunksDiff
  const audits = diff.audits

  const contentModalRef = useRef<{ open: (asset: AssetInfo) => void }>(null)
  const [searchText, setSearchText] = useState<string>('')
  const scoreItemsMap = useAuditScore()
  const onShowContentModal = useCallback(
    (asset: AssetInfo) => (e: MouseEvent<HTMLElement>) => {
      e.stopPropagation()
      contentModalRef.current?.open(asset)
    },
    [],
  )

  const currentAssets = useMemo(
    () => currentAllAssets.filter((asset) => asset.name.includes(searchText)),
    [currentAllAssets, searchText],
  )

  const { groups, items } = useMemo(() => {
    const grouped = groupBy(currentAssets, 'type')

    const items: AssetRow[] = []
    const groups: IGroup[] = []

    const exclusiveAssets = new Set<number>()
    currentChunks.forEach((chunk) => {
      if (chunk.exclusive) {
        chunk.assetRefs.forEach((ref) => {
          exclusiveAssets.add(ref)
        })
      }
    })

    const assetsAuditMap: Record<string, ItemAudit[]> = {}
    audits.current.forEach((audit) => {
      if (audit.score === BundleAuditScore.Good) {
        return
      }
      audit.detail?.items.forEach((i) => {
        const key = (i as Record<string, any>).name ?? (i as string)
        if (!key) {
          return
        }
        assetsAuditMap[key] ||= []
        assetsAuditMap[key].push({
          desc: (i as Record<string, any>).desc || audit.desc,
          title: audit.title,
          score: audit.score,
          link: audit.link,
        })
      })
    })

    Object.entries(grouped).forEach(([type, assets]) => {
      groups.push({
        key: type,
        name: type,
        startIndex: items.length,
        count: assets.length,
        isCollapsed: type !== AssetTypeEnum.Js,
      })
      items.push(
        ...assets.map((asset) => {
          return {
            ...asset,
            isNew: !baselineAssets?.find((a) => a.name === asset.name),
            audits: assetsAuditMap[asset.name] || [],
            exclusive: exclusiveAssets.has(asset.ref),
            baseline: assetsMatcher.findBestMatch(asset, baselineAssets || []).baseline,
          }
        }),
      )
    })

    return {
      groups,
      items,
    }
  }, [baselineAssets, currentAssets, audits, currentChunks])

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
        onRender: (asset) => {
          const lowestScore = asset.audits.sort((a, b) => a.score - b.score)[0]?.score ?? null
          const scoreItem =
            lowestScore !== null && lowestScore < BundleAuditScore.Good ? scoreItemsMap[lowestScore] : null
          const auditTooltipContent = (
            <ul style={{ paddingLeft: 24 }}>
              {asset.audits.map((a, i) => (
                <li key={i}>
                  <b>{a.title}: </b>
                  {a.desc}
                  {a.link ? <ForeignLink href={a.link}>Learn More</ForeignLink> : null}
                </li>
              ))}
            </ul>
          )
          return (
            <span style={{ position: 'relative', display: 'flex' }}>
              <span style={{ position: 'absolute', left: -36 }}>
                <TooltipWithEllipsis
                  tooltipContent={auditTooltipContent}
                  alwaysShown
                  background={scoreItem ? lighten(scoreItem.color, 0.2) : undefined}
                >
                  {scoreItem?.icon}
                </TooltipWithEllipsis>
              </span>
              <TooltipWithEllipsis content={asset.name} />
            </span>
          )
        },
      },

      {
        key: 'new',
        name: 'New',
        minWidth: 32,
        maxWidth: 80,
        onRender: (asset) => {
          if (asset.isNew) {
            return <FileAddOutlined style={{ color: SharedColors.red10 }} />
          }

          return null
        },
        sorter: (a) => (a.isNew ? 1 : -1),
      },

      {
        key: 'exclusive',
        name: 'Exclusive',
        minWidth: 60,
        maxWidth: 100,
        onRender: (asset) => {
          if (asset.exclusive) {
            return <CheckOutlined style={{ color: SharedColors.blue10 }} />
          }

          return null
        },
        onRenderHeader: () => {
          return (
            <TooltipHost content="Whether a file is only included in current entrypoint.">
              <span>
                Exclusive <QuestionCircleOutlined />
              </span>
            </TooltipHost>
          )
        },
        sorter: (a) => (a.exclusive ? 1 : -1),
      },
      {
        key: 'type',
        name: 'Type',
        minWidth: 40,
        maxWidth: 80,
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
        minWidth: 120,
        maxWidth: 200,
        onRender: (asset) => (
          <ByteSizeWithDiff
            underline={true}
            current={asset.size}
            baseline={asset.isNew ? asset.baseline?.size : undefined}
            hideIfNonComparable={true}
            showDiffBellow={!!diff.assetsDiff.baseline && asset.isNew}
            showNewIfIsNew
            colored
            hoverCardHeader={
              asset.baseline && asset.isNew ? (
                <SizeDiffHoverCardHeader>compare with: {asset.baseline.name}</SizeDiffHoverCardHeader>
              ) : undefined
            }
          />
        ),
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
      {
        key: 'content',
        name: 'Content',
        minWidth: 100,
        maxWidth: 100,
        onRender: (asset) => {
          if (asset.type !== AssetTypeEnum.Js || !asset.packages.length) {
            return null
          }
          return (
            <TraceIconWrap onClick={onShowContentModal(asset)} className="button">
              <AppstoreOutlined />
            </TraceIconWrap>
          )
        },
      },
    ],
    [searchText, scoreItemsMap, onShowContentModal, diff.assetsDiff.baseline],
  )

  const filteredColumns = useMemo(() => {
    let resultColumns = columns
    if (!baselineAssets) {
      resultColumns = resultColumns.filter((c) => c.key !== 'new')
    }

    if (!hasMultipleEntries || items.every((item) => !item.exclusive)) {
      resultColumns = resultColumns.filter((c) => c.key !== 'exclusive')
    }

    return resultColumns
  }, [baselineAssets, columns, hasMultipleEntries, items])

  const onRenderRow = useMemo(() => {
    return onAssetTableRenderRow(getAssetContent, onClickModule, onClickSideEffects, !!diff.assetsDiff.baseline)
  }, [getAssetContent, onClickModule, onClickSideEffects, diff.assetsDiff.baseline])

  return (
    <Stack>
      <Table
        items={items}
        groups={groups.length > 0 ? groups : undefined}
        selectionMode={SelectionMode.none}
        columns={filteredColumns}
        disableVirtualization={items.length < 100}
        onRenderRow={onRenderRow}
      />
      <ContentModal getAssetContent={getAssetContent} ref={contentModalRef} showDiff={!!diff.assetsDiff.baseline} />
    </Stack>
  )
}
