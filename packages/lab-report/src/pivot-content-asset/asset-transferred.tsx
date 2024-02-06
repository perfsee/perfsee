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

import { NeutralColors, Stack } from '@fluentui/react'
import { FC, memo, useMemo } from 'react'

import { DonutChart } from '@perfsee/components'
import { ColorfulSizeBar } from '@perfsee/components/color-size-bar'
import { PrettyBytes, RequestSchema } from '@perfsee/shared'

import { RequestType, RequestTypeColorsMaps } from '../snapshot-type'

import { RequestDesc } from './style'
import { getRequestSize, getTransferred } from './utils'

const renderContent = (type: string, value: number) => {
  return `${type}: ${PrettyBytes.stringify(value)}`
}

type Props = {
  requests: RequestSchema[]
  title?: string
  chartType?: 'donut' | 'bar'
}

export const AssetTransferred: FC<Props> = memo(
  ({ requests: requestItems, title = 'Asset Transferred By Type', chartType = 'bar' }) => {
    const { donutChartData, aggregated, totalTransferred, totalSize } = useMemo(() => {
      const typeMap = new Map<RequestType, number>()
      let totalTransferred = 0
      let totalSize = 0

      for (const item of requestItems) {
        const type = item.type as RequestType
        const transferred = getTransferred(item)
        const size = getRequestSize(item)

        const total = typeMap.get(type) ?? 0
        typeMap.set(type, total + transferred)

        totalTransferred += transferred
        totalSize += size
      }

      const sortedData = Array.from(typeMap).sort(([aType], [bType]) => aType.localeCompare(bType))

      const aggregated = []
      const donutChartData = []
      for (const [type, total] of sortedData) {
        aggregated.push({ type, value: total })
        donutChartData.push({
          name: renderContent(type, total),
          value: total,
          key: type,
          color: RequestTypeColorsMaps[type]?.background ?? NeutralColors.gray100,
        })
      }

      return {
        aggregated,
        totalTransferred,
        totalSize,
        donutChartData,
      }
    }, [requestItems])

    if (!requestItems.length) {
      return null
    }

    if (chartType === 'donut') {
      return (
        <Stack tokens={{ padding: '0 10px' }}>
          <b style={{ paddingBottom: '8px' }}>{title}</b>
          <DonutChart showLegend={true} data={donutChartData} total={totalTransferred} />
        </Stack>
      )
    }

    return (
      <div>
        <ColorfulSizeBar
          withTag={true}
          title={title}
          aggregated={aggregated}
          total={totalTransferred}
          colorMaps={RequestTypeColorsMaps}
          renderContent={renderContent}
          renderTooltip={renderContent}
        />
        <RequestDesc>
          <span>{requestItems.length} requests, </span>
          <span>totalling {PrettyBytes.stringify(totalTransferred)} of transfer. </span>
          <span>{PrettyBytes.stringify(totalSize)} uncompressed.</span>
        </RequestDesc>
      </div>
    )
  },
)
