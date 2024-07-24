import { Stack, List } from '@fluentui/react'
import { SharedColors } from '@fluentui/theme'
import { FC, useCallback } from 'react'

import { TooltipWithEllipsis, ColorButton } from '@perfsee/components'
import { PageSchema } from '@perfsee/platform/modules/shared'

import { NormalToken } from '../style'

type TempPageProps = {
  list: PageSchema[]
  clickDeleteButton: (item: PageSchema) => void
}

export const TempPageList: FC<TempPageProps> = ({ list, clickDeleteButton }) => {
  const onClick = useCallback(
    (item: PageSchema) => {
      return () => clickDeleteButton(item)
    },
    [clickDeleteButton],
  )

  const onRenderTempCell = useCallback(
    (item?: PageSchema) => {
      if (!item) return null

      return (
        <Stack tokens={NormalToken} horizontal horizontalAlign="space-between" verticalAlign="center">
          <TooltipWithEllipsis content={item.url}>{item.url}</TooltipWithEllipsis>
          <ColorButton color={SharedColors.red10} onClick={onClick(item)}>
            Delete
          </ColorButton>
        </Stack>
      )
    },
    [onClick],
  )
  return (
    <>
      <h3>Temporary Pages</h3>
      <List items={list} onRenderCell={onRenderTempCell} />
    </>
  )
}
