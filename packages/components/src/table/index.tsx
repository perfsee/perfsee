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
  IColumn,
  IDetailsRowProps,
  IDetailsRowStyles,
  IRenderFunction,
  IShimmeredDetailsListProps,
  ShimmeredDetailsList,
} from '@fluentui/react'
import { useMemo, useCallback, useState, MouseEvent, ReactNode, useEffect } from 'react'

import { SharedColors } from '@perfsee/dls'

import { Empty } from '../empty'

export const VerticalCenteredStyles: Partial<IDetailsRowStyles> = {
  root: {
    cursor: 'pointer',
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
  },
}

export interface TableColumnProps<T = any> extends IColumn {
  onRender?: (item: T, index?: number, column?: TableColumnProps<T>) => ReactNode
  sorter?: (item1: T, item2: T) => number
  comparator?: (item1: T, item2: T) => number
}

export type TableProps<T> = Omit<IShimmeredDetailsListProps, 'items' | 'columns'> & {
  items: T[]
  columns: TableColumnProps<T>[]
  onRowClick?: (item: T) => void
  columnVerticalCentered?: boolean
  disableVirtualization?: boolean
}

type ComparableItem<T> = T & {
  $setColorValue: {
    [name: string]: {
      isBest: boolean
      isWorst: boolean
    }
  }
}

const EMPTY_ITEM = '__EMPTY__'

function formatRawColumn<T = any>(columns: TableColumnProps<T>[]) {
  return columns.map((col) => ({
    ...col,
    onRender: col.comparator
      ? (item: ComparableItem<T>, i?: number, column?: TableColumnProps<T>) => {
          return (
            <span
              style={{
                color: item.$setColorValue[col.key]?.isBest
                  ? SharedColors.green10
                  : item.$setColorValue[col.key]?.isWorst
                  ? SharedColors.red10
                  : undefined,
              }}
            >
              {col.onRender?.(item, i, column) ?? (column?.fieldName ? item[column.fieldName] : '')}
            </span>
          )
        }
      : col.onRender,
  }))
}

export function Table<T = any>({
  columns: rawColumns,
  items: rawItems,
  groups,
  onColumnHeaderClick,
  onRenderRow,
  onRowClick,
  columnVerticalCentered = true,
  onShouldVirtualize,
  disableVirtualization = true,
  ...restProps
}: TableProps<T>) {
  const [columns, setColumns] = useState(() => {
    return formatRawColumn(rawColumns)
  })

  useEffect(() => {
    setColumns(formatRawColumn(rawColumns))
  }, [rawColumns])

  const onHeaderClick = useCallback(
    (e?: MouseEvent<HTMLElement>, column?: TableColumnProps<T>) => {
      if (onColumnHeaderClick) {
        onColumnHeaderClick(e, column)
      }

      if (column?.sorter) {
        let isSortedDescending = column.isSortedDescending

        if (column.isSorted) {
          isSortedDescending = !isSortedDescending
        }

        setColumns((cols) => {
          return cols.map((col) => {
            col.isSorted = col.key === column.key
            if (col.isSorted) {
              col.isSortedDescending = isSortedDescending
            }

            return col
          })
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onColumnHeaderClick],
  )

  const onClickCustomRow = useCallback(
    (item: T) => () => {
      onRowClick?.(item)
    },
    [onRowClick],
  )

  const coloredItems = useMemo(() => {
    if (!rawItems.length) {
      return [EMPTY_ITEM as unknown as T]
    }

    let items = rawItems
    const setColorColumns = columns.filter((column) => column.comparator)

    setColorColumns.forEach((column) => {
      let bestItemIndex = 0
      let worstItemIndex = 0

      rawItems.forEach((v, i) => {
        const best = column.comparator!(rawItems[bestItemIndex], v)
        if (typeof best === 'number') {
          bestItemIndex = best < 0 ? bestItemIndex : i
        }

        const worst = column.comparator!(rawItems[worstItemIndex], v)
        if (typeof worst === 'number') {
          worstItemIndex = worst > 0 ? worstItemIndex : i
        }
      })

      items = rawItems.map((item, i) => {
        const value = {
          [column.key]: {
            isBest: bestItemIndex === i,
            isWorst: worstItemIndex === i,
          },
        }

        item['$setColorValue'] = item['$setColorValue']
          ? {
              ...item['$setColorValue'],
              ...value,
            }
          : value
        return item
      })
    })
    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawItems])

  const items = useMemo(() => {
    const sortColumn = columns.find((column) => column.isSorted && column.sorter)

    if (!sortColumn) {
      return coloredItems
    }

    let chunks: T[][]
    if (groups) {
      chunks = groups.map((group) => {
        return coloredItems.slice(group.startIndex, group.startIndex + group.count)
      })
    } else {
      chunks = [coloredItems.slice(0)]
    }

    return chunks
      .map((chunk) => chunk.sort((a: T, b: T) => sortColumn.sorter!(a, b) * (sortColumn.isSortedDescending ? -1 : 1)))
      .flat()
  }, [columns, coloredItems, groups])

  const emptyRowRenderer: IRenderFunction<IDetailsRowProps> = useCallback(
    (row) => {
      if (!row) {
        return null
      }

      if (row.item === EMPTY_ITEM) {
        return <Empty withIcon={true} styles={{ root: { margin: '10px' } }} title="Empty List" />
      }

      const customStyle = columnVerticalCentered ? VerticalCenteredStyles : undefined

      const rawRow = onRenderRow ? onRenderRow(row) : <DetailsRow {...row} styles={customStyle} />
      return <div onClick={onClickCustomRow(row?.item)}>{rawRow}</div>
    },
    [columnVerticalCentered, onRenderRow, onClickCustomRow],
  )

  const onShouldVirtualizeImpl = useMemo(() => {
    return onShouldVirtualize ?? (() => !disableVirtualization)
  }, [onShouldVirtualize, disableVirtualization])

  return (
    <ShimmeredDetailsList
      {...restProps}
      items={items}
      columns={columns}
      onColumnHeaderClick={onHeaderClick}
      groups={groups}
      onRenderRow={emptyRowRenderer}
      onShouldVirtualize={onShouldVirtualizeImpl}
    />
  )
}
