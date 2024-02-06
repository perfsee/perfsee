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

import { SelectionMode } from '@fluentui/react'
import { groupBy } from 'lodash'
import { FC, useMemo } from 'react'

import { TableColumnProps, Table, TooltipWithEllipsis } from '@perfsee/components'
import { getRequestDomain, getRequestSize, getTransferred } from '@perfsee/lab-report/pivot-content-asset/utils'
import { formatMsDuration } from '@perfsee/platform/common'
import { RequestSchema, PrettyBytes } from '@perfsee/shared'

type Props = {
  requests: RequestSchema[]
}

type RequestByDomain = {
  domain: string
  count: number
  size: number
  transferred: number
  dns: number
  ssl: number
  connect: number
  timing: number
}

const durationColumns = ['ssl', 'dns', 'connect', 'timing'].map((key) => {
  return {
    key: key,
    name: key.toUpperCase(),
    minWidth: 100,
    maxWidth: 120,
    sorter: (a, b) => a[key] - b[key],
    onRender: (item) => formatMsDuration(item[key], true, 2),
  } as TableColumnProps<RequestByDomain>
})

const columns: TableColumnProps<RequestByDomain>[] = [
  {
    key: 'domain',
    name: 'Domain',
    minWidth: 120,
    maxWidth: 260,
    onRender: (item) => <TooltipWithEllipsis content={item.domain} />,
  },
  {
    key: 'count',
    name: 'Requests',
    minWidth: 80,
    maxWidth: 100,
    sorter: (a, b) => a.count - b.count,
    onRender: (item) => item.count,
  },
  {
    key: 'size',
    name: 'Size',
    minWidth: 100,
    maxWidth: 120,
    sorter: (a, b) => a.size - b.size,
    onRender: (item) => PrettyBytes.stringify(item.size),
  },
  {
    key: 'transferred',
    name: 'Transferred',
    minWidth: 100,
    maxWidth: 120,
    sorter: (a, b) => a.transferred - b.transferred,
    onRender: (item) => PrettyBytes.stringify(item.transferred),
  },
  ...durationColumns,
]

export const ConnectionByDomainTable: FC<Props> = ({ requests }) => {
  const items = useMemo(() => {
    const requestByDomain = groupBy(requests, (request) => {
      return getRequestDomain(request)
    })
    return Object.keys(requestByDomain).map((domain) => {
      const values = requestByDomain[domain]

      const payload = values.reduce(
        (p, c) => {
          const { timings, timing } = c as RequestSchema
          timings.forEach((time) => {
            if (time.name === 'DNS') {
              p.dns += time.value
            }
            if (time.name === 'Connect') {
              p.connect += time.value
            }
            if (time.name === 'SSL') {
              p.ssl += time.value
            }
          })
          p.size += getRequestSize(c)
          p.transferred += getTransferred(c)
          p.timing += timing
          return p
        },
        { size: 0, transferred: 0, dns: 0, ssl: 0, connect: 0, timing: 0 },
      )
      return {
        domain,
        count: values.length,
        ...payload,
      }
    })
  }, [requests])

  return (
    <Table
      items={items}
      detailsListStyles={{ headerWrapper: { '> div[role=row]': { paddingTop: 0 } } }}
      selectionMode={SelectionMode.none}
      columns={columns}
    />
  )
}
