import { IDetailsRowProps, IDetailsRowStyles, DetailsRow, PivotItem } from '@fluentui/react'
import { NeutralColors } from '@fluentui/theme'
import { useState, useMemo, useCallback } from 'react'

import { TooltipWithEllipsis } from '@perfsee/components'
import { AssetInfo } from '@perfsee/shared'

import { ColoredSize } from '../components'
import { TableExtraWrap, StyledPivot, StyledInfoItem } from '../style'

type Props = { item: AssetInfo }

const TableExtraInfo = (props: Props) => {
  const { item } = props

  return (
    <TableExtraWrap>
      <StyledPivot styles={{ itemContainer: { width: '100%', padding: '8px' } }}>
        <PivotItem headerText="included packages">
          {item.packages.map((pkg) => {
            if (typeof pkg === 'string') {
              return <StyledInfoItem key={pkg}>{pkg}</StyledInfoItem>
            }

            return (
              <StyledInfoItem key={pkg.path}>
                <TooltipWithEllipsis content={pkg.name + (pkg.version ? `@${pkg.version}` : '')} />
                <ColoredSize size={pkg.size} hoverable={false} />
              </StyledInfoItem>
            )
          })}
        </PivotItem>
      </StyledPivot>
    </TableExtraWrap>
  )
}

const DetailRowItem = (props: IDetailsRowProps) => {
  const [opened, setOpened] = useState<boolean>()

  const customStyles: Partial<IDetailsRowStyles> = useMemo(
    () => ({
      cell: {
        cursor: 'pointer',
        backgroundColor: opened ? NeutralColors.gray20 : undefined,
      },
    }),
    [opened],
  )

  const onClick = useCallback(() => {
    setOpened((opened) => !opened)
  }, [])

  return (
    <>
      <DetailsRow {...props} styles={customStyles} onClick={onClick} />
      {opened && <TableExtraInfo item={props.item} />}
    </>
  )
}

export const onAssetTableRenderRow = (props?: IDetailsRowProps) => {
  if (props) {
    return <DetailRowItem {...props} />
  }
  return null
}
