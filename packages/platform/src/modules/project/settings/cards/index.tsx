import { ReactNode, useMemo } from 'react'

import { CardContainer, CardWrapper } from './styled'

type SettingCardsProps<T> = {
  items: T[]
  onRenderCell: (item: T) => ReactNode
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
