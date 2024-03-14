import { IDetailsRowProps, IDetailsRowStyles, DetailsRow, PivotItem, Link } from '@fluentui/react'
import { NeutralColors } from '@fluentui/theme'
import { parse, stringify } from 'query-string'
import { useState, useMemo, useCallback, useContext } from 'react'
import { useHistory, useLocation } from 'react-router'

import { TooltipWithEllipsis } from '@perfsee/components'
import { AssetInfo, SOURCE_CODE_PATH } from '@perfsee/shared'

import { ColoredSize } from '../components'
import { PackageTraceContext } from '../context'
import { TableExtraWrap, StyledPivot, StyledInfoItem } from '../style'

type Props = { item: AssetInfo }

const TableExtraInfo = (props: Props) => {
  const { item } = props
  const history = useHistory()
  const location = useLocation()
  const queries: { tab?: string; trace?: string } = parse(location.search)
  const { setRef } = useContext(PackageTraceContext)

  const onClickTrace = useCallback(
    (ref: number) => () => {
      if (setRef) {
        setRef(ref)
      } else if (queries.trace !== String(ref)) {
        history.push(`${location.pathname}?${stringify({ ...queries, trace: ref })}`)
      }
    },
    [history, queries, location, setRef],
  )

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
                {pkg.path !== SOURCE_CODE_PATH ? <Link onClick={onClickTrace(pkg.ref)}>Trace</Link> : null}
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
        overflow: 'visible',
      },
      root: {
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
