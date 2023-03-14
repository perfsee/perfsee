import { IDetailsRowProps, IDetailsRowStyles, DetailsRow, Spinner, SelectionMode } from '@fluentui/react'
import { NeutralColors } from '@fluentui/theme'
import { useModule } from '@sigi/react'
import dayjs from 'dayjs'
import { useState, useMemo, useCallback, useEffect } from 'react'

import { Empty, Table, TableColumnProps, TooltipWithEllipsis } from '@perfsee/components'
import { MetricType } from '@perfsee/shared'

import { SnapshotStatusTag } from '../../lab/list/status-tag'

import { formatMetric } from './metric-diff'
import { GroupUsageModule, ProjectUsageInfo, LatestReport } from './module'

type TimeFilterProps = { startTime: number; endTime: number }
type Props = { item: ProjectUsageInfo } & TimeFilterProps

const tableHeaderStyles = { cellName: { fontSize: '12px' } }
const columns = [
  {
    key: 'name',
    name: 'Name',
    styles: tableHeaderStyles,
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => (
      <TooltipWithEllipsis content={`${item.page.name}-${item.profile.name}-${item.environment.name}`} />
    ),
  },
  {
    key: 'status',
    name: 'Status',
    styles: tableHeaderStyles,
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => <SnapshotStatusTag status={item.status} />,
  },
  ...Object.keys(MetricType).map((key) => {
    return {
      key: key,
      name: key,
      minWidth: 120,
      maxWidth: 180,
      styles: tableHeaderStyles,
      onRender: (item: LatestReport) => {
        if (!item.metrics[MetricType[key]]) {
          return '-'
        }

        return formatMetric(key, item.metrics[MetricType[key]])
      },
    }
  }),
] as TableColumnProps<LatestReport>[]

const TableExtraInfo = (props: Props) => {
  const { startTime, endTime, item } = props

  const [{ reports }, dispatcher] = useModule(GroupUsageModule, {
    selector: (state) => ({
      reports: state.reportsInProject[item.id],
    }),
    dependencies: [item.id],
  })

  useEffect(() => {
    dispatcher.getLatestSnapshotReports({
      projectId: item.id,
      from: dayjs.unix(startTime).toISOString(),
      to: dayjs.unix(endTime).toISOString(),
    })
  }, [dispatcher, endTime, item.id, startTime])

  if (!reports) {
    return <Spinner />
  }

  if (!reports.length) {
    return <Empty title="No snapshot report data during this time period" withIcon={false} />
  }

  return (
    <div>
      <Table
        detailsListStyles={{
          headerWrapper: {
            '> div[role=row]': { paddingTop: 0, backgroundColor: NeutralColors.gray10 },
          },
          contentWrapper: { 'div[role=row]': { backgroundColor: NeutralColors.gray10 } },
        }}
        compact={true}
        items={reports}
        selectionMode={SelectionMode.none}
        columns={columns}
        disableVirtualization={reports.length < 100}
      />
    </div>
  )
}

interface DetailRowItemProps extends IDetailsRowProps {
  startTime: number
  endTime: number
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
      {opened && <TableExtraInfo {...props} />}
    </>
  )
}

export const onGroupTableRenderRow = (timeFilter: TimeFilterProps) => {
  return (props?: IDetailsRowProps) => {
    if (props) {
      return <DetailRowItem {...props} {...timeFilter} />
    }
    return null
  }
}
