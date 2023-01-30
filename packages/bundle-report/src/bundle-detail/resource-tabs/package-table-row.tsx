import { IDetailsRowProps, IDetailsRowStyles, DetailsRow, PivotItem } from '@fluentui/react'
import { NeutralColors } from '@fluentui/theme'
import { useState, useMemo, useCallback } from 'react'

import { TooltipWithEllipsis } from '@perfsee/components'
import { OLD_SOURCE_CODE_PATH, Size, SOURCE_CODE_PATH } from '@perfsee/shared'

import { ColoredSize } from '../components'
import { TableExtraWrap, StyledInfoItem, StyledPivot } from '../style'

import { Package } from './package-filter'

type LoadInner = {
  size: Size
  list: Record<string, Size>
}

export type LoadType = {
  intermidiate?: LoadInner
  initial?: LoadInner
  async?: LoadInner
}

type Props = { item: Package; packagesLoadTypeMap: Map<number, LoadType> }

const TableExtraInfo = (props: Props) => {
  const { item, packagesLoadTypeMap } = props

  const loadType = packagesLoadTypeMap.get(item.ref) ?? {}

  return (
    <TableExtraWrap>
      <StyledPivot styles={{ itemContainer: { width: '100%', padding: '8px' } }}>
        {Object.entries(loadType).map(([type, { list }]) => {
          const title = `${type} assets`
          return (
            <PivotItem headerText={title} key={type}>
              {Object.entries(list)
                .sort(([, sizeA], [, sizeB]) => sizeB.raw - sizeA.raw)
                .map(([key, innerSize]) => {
                  return (
                    <StyledInfoItem key={key}>
                      <TooltipWithEllipsis content={key} />
                      <ColoredSize size={innerSize} hoverable={false} />
                    </StyledInfoItem>
                  )
                })}
            </PivotItem>
          )
        })}
        {!!item.issuers.length && (
          <PivotItem headerText="issuers">
            {item.issuers.map((issuer) => (
              <StyledInfoItem key={issuer}>
                <b>{issuer === OLD_SOURCE_CODE_PATH ? SOURCE_CODE_PATH : issuer}</b>
              </StyledInfoItem>
            ))}
          </PivotItem>
        )}
        {!!item.notes?.length && (
          <PivotItem headerText="notes">
            {item.notes.map((note) => (
              <StyledInfoItem key={note}>
                <b>{note}</b>
              </StyledInfoItem>
            ))}
          </PivotItem>
        )}
      </StyledPivot>
    </TableExtraWrap>
  )
}

interface DetailRowItemProps extends IDetailsRowProps {
  map: Map<number, LoadType>
}

const DetailRowItem = (props: DetailRowItemProps) => {
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
      {opened && <TableExtraInfo packagesLoadTypeMap={props.map} item={props.item} />}
    </>
  )
}

export const onPackageTableRenderRow = (map: Map<number, LoadType>) => {
  return (props?: IDetailsRowProps) => {
    if (props) {
      return <DetailRowItem map={map} {...props} />
    }
    return null
  }
}
