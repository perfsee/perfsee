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

import { FolderOpenFilled, PartitionOutlined } from '@ant-design/icons'
import {
  GroupedList,
  IGroup,
  IGroupRenderProps,
  GroupHeader,
  DetailsRow,
  IColumn,
  IGroupHeaderProps,
  Stack,
  TooltipHost,
  TooltipOverflowMode,
} from '@fluentui/react'
import { FC, MouseEvent, useCallback, useMemo } from 'react'

import { ModuleTreeNode } from '@perfsee/bundle-analyzer'
import { Empty, FileColorsMaps, ForeignLink, TooltipWithEllipsis } from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'

import { ColoredSize } from '../bundle-detail/components'
import { TraceIconWrap } from '../bundle-detail/style'

import { TreeviewColumnCell, ModuleLabel } from './styled'

enum AssetTypeEnum {
  Js = 'js',
  Css = 'css',
  Image = 'image',
  Font = 'font',
  Html = 'html',
  Media = 'media',
  Other = 'other',
}

export function detectFileType(name: string): AssetTypeEnum {
  const regexps: { [k in AssetTypeEnum]?: RegExp } = {
    [AssetTypeEnum.Js]: /\.m?js$/i,
    [AssetTypeEnum.Css]: /\.css$/i,
    [AssetTypeEnum.Html]: /\.html?$/i,
    [AssetTypeEnum.Image]: /\.(jpe?g|png|svg|gif|webp|heif|bmp|avif|cur|tiff?|apng|jxl)$/i,
    [AssetTypeEnum.Font]: /\.(otf|ttf|eot|woff2?)$/i,
    [AssetTypeEnum.Media]: /\.(mp4|webm|mkv|flv|avi|wmv|ogv|mp3|wav|ogg|m4a|aac)$/i,
  }
  for (const [type, regexp] of Object.entries(regexps)) {
    if (regexp?.test(name)) {
      return type as AssetTypeEnum
    }
  }

  return AssetTypeEnum.Other
}

export interface TreeViewProps {
  content: ModuleTreeNode[]
  searchText?: string
  onClickItem?: (item: ModuleItem) => void
  onClickSideEffects?: (item: ModuleItem) => void
}

export type ModuleItem = Omit<ModuleTreeNode, 'children'> & {
  key: string
  level: number
  concatenated?: boolean
  lastChild?: boolean
}

function flattenTree(
  tree: ModuleTreeNode[],
  level = 0,
  search?: string,
  currentFolder = '',
  startIndex = 0,
): { items: ModuleItem[]; groups: IGroup[]; nextIndex: number } {
  let items: ModuleItem[] = []
  const groups: IGroup[] = []
  let currentIndex = startIndex

  const hasChildren = tree.some((node) => node.children?.length || node.modules?.length)

  tree.forEach((node) => {
    const nodeStartIndex = currentIndex
    if (node.children && node.children.length > 0) {
      const childResult = flattenTree(
        node.children,
        level + 1,
        search,
        level >= 0 ? currentFolder + `${node.name}/` : currentFolder,
        currentIndex,
      )

      items = items.concat(childResult.items)

      if (childResult.items.length === 0) {
        return
      }

      groups.push({
        key: currentFolder + node.name,
        name: node.name,
        startIndex: nodeStartIndex,
        count: childResult.nextIndex - nodeStartIndex,
        level,
        children: childResult.groups,
        data: {
          value: node.value,
          gzip: node.gzip,
          brotli: node.brotli,
        },
      })

      currentIndex = childResult.nextIndex
    } else {
      if (node.modules?.length ?? 0 > 1) {
        const modules = node.modules!.filter((module) => (search ? module.includes(search) : true))
        modules.forEach((module, i) => {
          const name = module.split(currentFolder).slice(-1)[0] || module
          items.push({
            key: module,
            level,
            name,
            concatenated: true,
            lastChild: i === modules.length - 1,
            value: 0,
            gzip: 0,
            brotli: 0,
            dynamic: node.dynamic && node.name.includes(name),
            sideEffects: node.sideEffects,
            esm: node.esm,
          })
        })
        if (modules.length > 0) {
          groups.push({
            key: currentFolder + node.name,
            name: node.name,
            startIndex: currentIndex,
            count: modules.length,
            level,
            data: node,
          })
        }
        currentIndex += modules.length
      } else {
        if (search && !(currentFolder + node.name).includes(search)) {
          return
        }
        items.push({ key: currentFolder + node.name, level, ...node })
        if (hasChildren) {
          groups.push({
            key: currentFolder + node.name,
            name: node.name,
            startIndex: currentIndex,
            count: 1,
            level,
            data: {
              hide: true,
            },
          })
        }
        currentIndex++
      }
    }
  })

  return { items, groups, nextIndex: currentIndex }
}

export const TreeView: FC<TreeViewProps> = ({ content, onClickItem, searchText, onClickSideEffects }) => {
  const { items, groups } = useMemo(() => flattenTree(content, -1, searchText), [content, searchText])

  const onRowClick = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const target = e.currentTarget as HTMLDivElement
      const index = target.dataset['index']
      if (index) {
        const item = items[index]
        item && onClickItem?.(item)
      }
    },
    [onClickItem, items],
  )

  const columns: IColumn[] = useMemo(
    () => [
      {
        name: 'name',
        key: 'key',
        minWidth: 100,
        onRender(item: ModuleItem, _index, _column) {
          const Icon = FileColorsMaps[detectFileType(item.name)]
          const size = {
            raw: item.value,
            gzip: item.gzip,
            brotli: item.brotli,
          }

          const onClickUnused = (e: MouseEvent<HTMLElement>) => {
            e.stopPropagation()
            onClickSideEffects?.(item)
          }

          return (
            <TreeviewColumnCell
              horizontal
              verticalAlign="center"
              tokens={{ childrenGap: 10 }}
              concatenated={item.concatenated}
              lastChild={item.lastChild}
            >
              <Icon.icon fontSize={14} style={{ flexShrink: 0 }} />
              <span style={{ direction: item.concatenated ? 'rtl' : 'ltr', overflow: 'hidden' }}>
                <TooltipHost
                  content={item.name}
                  overflowMode={TooltipOverflowMode.Parent}
                  calloutProps={{ styles: { calloutMain: { wordBreak: 'break-word' } } }}
                >
                  <span style={{ direction: 'ltr', unicodeBidi: 'bidi-override' }}>{item.name}</span>
                </TooltipHost>
              </span>
              {item.concatenated ? (
                <ModuleLabel color={SharedColors.blue10}>concatenated</ModuleLabel>
              ) : (
                <span style={{ fontSize: 12 }}>
                  <ColoredSize size={size} />
                </span>
              )}
              {item.dynamic ? <ModuleLabel color={SharedColors.cyan10}>dynamic</ModuleLabel> : null}
              {item.sideEffects ? (
                <TooltipHost
                  content={
                    <>
                      Explicitly or implicitly marked as having side effects in package.json, which may prevent dead
                      code removal from tree-shaking.{' '}
                      <ForeignLink href="https://webpack.js.org/guides/tree-shaking/#mark-the-file-as-side-effect-free">
                        Learn more
                      </ForeignLink>
                    </>
                  }
                >
                  <ModuleLabel color={SharedColors.orange20}>side effects</ModuleLabel>
                </TooltipHost>
              ) : null}
              {item.unused ? (
                <TooltipHost content="Tree-shaking bailout: having side effects in source code. Click to see side effects.">
                  {/* eslint-disable-next-line */}
                  <ModuleLabel warning onClick={onClickUnused}>
                    {item.unused} unused
                  </ModuleLabel>
                </TooltipHost>
              ) : null}
              {item.esm === false ? (
                <TooltipHost content="Not an ECMAScript module, which may prevent dead code removal from tree-shaking.">
                  <ModuleLabel color={SharedColors.orange10}>non-esm</ModuleLabel>
                </TooltipHost>
              ) : null}
              <TooltipHost content="Click to see module import reasons">
                <TraceIconWrap>
                  <PartitionOutlined role="icon" />
                </TraceIconWrap>
              </TooltipHost>
            </TreeviewColumnCell>
          )
        },
      },
    ],
    [onClickSideEffects],
  )

  const onRenderCell = useCallback(
    (nestingDepth: number | undefined, item: ModuleItem, itemIndex?: number, group?: IGroup) => {
      return item && typeof itemIndex === 'number' && itemIndex > -1 ? (
        <div data-index={itemIndex} onClick={onRowClick}>
          <DetailsRow
            item={item}
            groupNestingDepth={group?.data?.hide && nestingDepth ? nestingDepth - 1 : nestingDepth}
            compact
            itemIndex={itemIndex}
            group={group}
            columns={columns}
            styles={{
              root: {
                width: '100%',
                background: 'white !important',
              },
              check: { display: 'none !important' },
              cell: {
                overflow: 'visible',
                cursor: 'pointer',
                ':hover': {
                  backgroundColor: 'rgb(243, 242, 241)',
                },
                width: '100% !important',
                padding: '0 8px 0 12px',
                display: 'flex',
              },
              fields: { width: '100%', minWidth: 0 },
            }}
          />
        </div>
      ) : null
    },
    [onRowClick, columns],
  )

  const onRenderGroupHeaderCheckbox = useCallback(() => {
    return null
  }, [])

  const onRenderGroupHeaderName = useCallback(
    (props?: IGroupHeaderProps, defaultRenderer?: (props?: IGroupHeaderProps) => JSX.Element | null) => {
      const group = props?.group
      const size = group?.data?.value
        ? {
            raw: group.data.value,
            gzip: group.data.gzip,
            brotli: group.data.brotli,
          }
        : null
      return (
        <Stack horizontal verticalAlign="center" style={{ fontSize: 12 }}>
          {group?.data?.concatenated ? null : (
            <FolderOpenFilled style={{ marginRight: 10, color: SharedColors.orange10, fontSize: 14 }} />
          )}
          <TooltipWithEllipsis tooltipContent={group?.name}>{defaultRenderer?.(props)}</TooltipWithEllipsis>
          {size ? (
            <span style={{ fontSize: 12, margin: '0 6px' }}>
              <ColoredSize size={size} />
            </span>
          ) : null}
        </Stack>
      )
    },
    [],
  )

  const groupProps: IGroupRenderProps = useMemo(() => {
    return {
      onRenderHeader(props) {
        if (props?.group?.data?.hide) {
          return null
        }
        const concatenated = props?.group?.data?.concatenated
        return (
          <GroupHeader
            {...props}
            onRenderGroupHeaderCheckbox={onRenderGroupHeaderCheckbox}
            onRenderName={onRenderGroupHeaderName}
            styles={{
              check: { display: 'none' },
              title: { fontWeight: 300, paddingLeft: concatenated ? 0 : undefined, cursor: 'unset' },
              groupHeaderContainer: { height: 32, overflow: 'hidden', span: { flexShrink: 0 } },
              expand: { cursor: 'pointer' },
            }}
            expandButtonProps={
              concatenated
                ? {
                    style: {
                      float: 'right',
                      color: concatenated ? SharedColors.blueMagenta10 : undefined,
                    },
                  }
                : undefined
            }
            expandButtonIcon={concatenated ? 'wallet' : undefined}
          />
        )
      },
    }
  }, [onRenderGroupHeaderCheckbox, onRenderGroupHeaderName])

  return content.length ? (
    <GroupedList
      items={items}
      groups={groups.length > 1 ? groups : groups[0]?.children}
      compact
      onRenderCell={onRenderCell}
      groupProps={groupProps}
    />
  ) : (
    <Empty withIcon title="No data" styles={{ root: { height: '100%' } }} />
  )
}
