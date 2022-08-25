import { ExclamationCircleOutlined } from '@ant-design/icons'
import { TooltipHost } from '@fluentui/react'
import { NeutralColors, SharedColors } from '@fluentui/theme'

import { TableColumnProps, TooltipWithEllipsis, RequestLabelDot } from '@perfsee/components'
import { formatMsDuration } from '@perfsee/platform/common'
import { RequestSchema } from '@perfsee/shared'

import { RequestType, RequestTypeColorsMaps } from '../../../snapshot-type'

import {
  getRequestName,
  getRequestDomain,
  getStartTime,
  PrioritySortKey,
  getTransferred,
  needOptimizeTransferred,
  getRequestSize,
  needOptimizeCompression,
  needOptimizeTiming,
} from './utils'

export enum ColumnKeys {
  Index = 'index',
  Method = 'method',
  Status = 'status',
  Name = 'name',
  Domain = 'domain',
  Protocol = 'protocol',
  StartTime = 'startTime',
  Priority = 'priority',
  Type = 'type',
  Transferred = 'transferred',
  Size = 'size',
  Timing = 'timing',
  Waterfall = 'waterfall',
}

export const getColumnConfig = (columnKey: ColumnKeys) => {
  switch (columnKey) {
    case ColumnKeys.Name: {
      return { disable: true, defaultShown: true }
    }
    case ColumnKeys.Priority:
    case ColumnKeys.Protocol:
    case ColumnKeys.StartTime:
    case ColumnKeys.Timing: {
      return { disable: false, defaultShown: false }
    }
    default:
      return { disable: false, defaultShown: true }
  }
}

export const DefaultColumns: TableColumnProps<RequestSchema>[] = [
  {
    key: ColumnKeys.Index,
    name: '#',
    fieldName: ColumnKeys.Index,
    minWidth: 40,
    maxWidth: 50,
    sorter: (a, b) => a.index - b.index,
  },
  {
    key: ColumnKeys.Method,
    name: 'Method',
    fieldName: ColumnKeys.Method,
    minWidth: 60,
    maxWidth: 80,
    sorter: (a, b) => a.method.localeCompare(b.method),
  },
  {
    key: ColumnKeys.Status,
    name: 'Status',
    fieldName: ColumnKeys.Status,
    minWidth: 60,
    maxWidth: 80,
    sorter: (a, b) => a.status.localeCompare(b.status),
  },
  {
    key: ColumnKeys.Name,
    name: 'Name',
    minWidth: 120,
    maxWidth: 220,
    sorter: (a, b) => getRequestName(a).localeCompare(getRequestName(b)),
    onRender: (item) => {
      const name = getRequestName(item)
      return <TooltipWithEllipsis content={name} />
    },
  },
  {
    key: ColumnKeys.Domain,
    name: 'Domain',
    minWidth: 100,
    maxWidth: 200,
    sorter: (a, b) => getRequestDomain(a).localeCompare(getRequestDomain(b)),
    onRender: (item) => {
      const domain = getRequestDomain(item)
      return <TooltipWithEllipsis content={domain} />
    },
  },
  {
    key: ColumnKeys.Protocol,
    name: 'Protocol',
    fieldName: ColumnKeys.Protocol,
    minWidth: 80,
    maxWidth: 110,
    sorter: (a, b) => a.protocol.localeCompare(b.protocol),
  },
  {
    key: ColumnKeys.StartTime,
    name: 'StartTime',
    minWidth: 100,
    maxWidth: 160,
    onRender: (item) => getStartTime(item, true),
    sorter: (a, b) => a.startTime - b.startTime,
  },
  {
    key: ColumnKeys.Priority,
    name: 'Priority',
    fieldName: ColumnKeys.Priority,
    minWidth: 90,
    maxWidth: 150,
    sorter: (a, b) => {
      return PrioritySortKey[a.priority] - PrioritySortKey[b.priority]
    },
  },
  {
    key: ColumnKeys.Type,
    name: 'Type',
    minWidth: 100,
    maxWidth: 160,
    sorter: (a, b) => a.type.localeCompare(b.type),
    onRender: (item) => {
      const type = item.type as RequestType
      const color = RequestTypeColorsMaps[type]?.background ?? NeutralColors.black
      return (
        <div>
          <RequestLabelDot color={color} />
          {type}
        </div>
      )
    },
  },
  {
    key: ColumnKeys.Transferred,
    name: 'Transferred',
    minWidth: 100,
    maxWidth: 150,
    sorter: (a, b) => getTransferred(a) - getTransferred(b),
    onRender: (item) => {
      const color = needOptimizeTransferred(item) ? SharedColors.red10 : undefined
      return <span style={{ color }}>{getTransferred(item, true)}</span>
    },
  },
  {
    key: ColumnKeys.Size,
    name: 'Size',
    minWidth: 90,
    maxWidth: 150,
    sorter: (a, b) => getRequestSize(a) - getRequestSize(b),
    onRender: (item) => {
      const needOptimize = needOptimizeCompression(item)
      const tips = needOptimize && <Tips />
      const color = needOptimize ? SharedColors.red10 : undefined

      return (
        <span style={{ color }}>
          {getRequestSize(item, true)}
          {tips}
        </span>
      )
    },
  },
  {
    key: ColumnKeys.Timing,
    name: 'Timing',
    minWidth: 100,
    maxWidth: 150,
    onRender: (item) => {
      const color = needOptimizeTiming(item) ? SharedColors.red10 : undefined
      return <span style={{ color }}>{formatMsDuration(item.timing, true)}</span>
    },
    sorter: (a, b) => {
      return a.timing - b.timing
    },
  },
]

const Tips = () => {
  return (
    <TooltipHost content={'Enable HTTP compression'}>
      <ExclamationCircleOutlined size={12} style={{ cursor: 'pointer', marginLeft: '4px' }} />
    </TooltipHost>
  )
}
