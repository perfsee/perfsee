import { SelectionMode } from '@fluentui/react'
import { ReactNode, useMemo } from 'react'

import { Table, TableColumnProps } from '@perfsee/components'

import { CardContainer, CardWrapper } from './styled'

type SettingCardsProps<T> = {
  items: T[]
  onRenderCell: (item: T) => ReactNode
}

type SettingTableProps<T> = {
  items: T[]
  columns: TableColumnProps<T>[]
}

export const SettingCards = <T,>(props: SettingCardsProps<T>) => {
  const { items, onRenderCell } = props

  const elements = useMemo(() => {
    return items.map((item, i) => {
      const inner = onRenderCell(item)
      return <CardWrapper key={i}>{inner}</CardWrapper>
    })
  }, [items, onRenderCell])

  return <CardContainer>{elements}</CardContainer>
}

export const SettingTable = <T,>(props: SettingTableProps<T>) => {
  const { items, columns } = props

  return <Table items={items} columns={columns} selectionMode={SelectionMode.none} />
}
