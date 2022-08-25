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

import { Modal } from '@fluentui/react'
import { FC, useCallback, useMemo } from 'react'

import { Chart, ChartHeader, EChartsOption } from '@perfsee/components/chart'
import { ChartEventParam } from '@perfsee/components/chart/types'
import { SOURCE_CODE_PATH, PackageIssueMap } from '@perfsee/shared'

type Props = {
  traceSourceRef: number | null
  packageIssueMap: PackageIssueMap | undefined
  onClose: () => void
  onChangeSource: (ref: number) => void
}

type GraphNodeData = { name: string; ref?: number; symbolSize?: number }

export const ImportTraceModal: FC<Props> = ({ traceSourceRef, packageIssueMap, onClose, onChangeSource }) => {
  const [points, edges] = useMemo(() => {
    if (!traceSourceRef || !packageIssueMap) {
      return []
    }

    const pkgRefs: Array<[null | number, number]> = [[null, traceSourceRef]]
    const pointsMap = new Map<string, GraphNodeData>()
    const edges: Array<{ source: string; target: string }> = []

    while (pkgRefs.length) {
      const current = pkgRefs.pop()
      if (!current) {
        continue
      }

      const [sourceRef, ref] = current

      const sourcePkg = sourceRef ? packageIssueMap[sourceRef] : null
      const pkg = packageIssueMap[ref]
      if (!pkg) {
        continue
      }

      if (!pointsMap.has(pkg.name)) {
        const value = { name: pkg.name }

        if (!sourcePkg || pkg.name === SOURCE_CODE_PATH) {
          value['symbolSize'] = 100
          value['itemStyle'] = {
            color: '#91cc75',
          }
        } else {
          value['symbolSize'] = 80
          value['ref'] = pkg.ref
        }

        pointsMap.set(pkg.name, value)
      }

      if (sourcePkg) {
        edges.push({
          source: pkg.name,
          target: sourcePkg.name,
        })
      }

      if (pkg.issuerRefs?.length && pkg.name !== SOURCE_CODE_PATH) {
        pkgRefs.push(...pkg.issuerRefs.map((nextRef) => [ref, nextRef] as [number, number]))
      }
    }

    const traceSourceName = packageIssueMap[traceSourceRef].name

    Object.values(packageIssueMap)
      .filter(({ issuerRefs }) => issuerRefs.some((ref) => ref === traceSourceRef))
      .forEach(({ name, ref }) => {
        pointsMap.set(name, { name, ref, itemStyle: { color: '#73c0de' } })
        edges.push({
          source: traceSourceName,
          target: name,
        })
      })

    return [[...pointsMap.values()], edges]
  }, [packageIssueMap, traceSourceRef])

  const option = useMemo<EChartsOption>(
    () => ({
      series: [
        {
          type: 'graph',
          layout: 'circular',
          roam: true,
          animation: false,
          symbolSize: 50,
          edgeSymbol: ['none', 'arrow'],
          label: {
            show: true,
          },
          data: points,
          links: edges,
          emphasis: {
            focus: 'adjacency',
            lineStyle: {
              width: 4,
            },
          },
        },
      ],
    }),
    [edges, points],
  )

  const sourceTitle = useMemo(() => {
    if (!traceSourceRef || !packageIssueMap) {
      return ''
    }

    return packageIssueMap[traceSourceRef].name
  }, [packageIssueMap, traceSourceRef])

  const onClickChart = useCallback(
    (params: ChartEventParam) => {
      if (!params || params.dataType !== 'node') {
        return
      }

      const data = params.data as GraphNodeData

      if (data.ref) {
        onChangeSource(data.ref)
      }
    },
    [onChangeSource],
  )

  return (
    <Modal isOpen={!!traceSourceRef} onDismiss={onClose} styles={{ main: { width: '80vw' } }}>
      <Chart option={option} mergeCustomOption={false} style={{ height: '80vh' }} onEvents={{ click: onClickChart }}>
        <ChartHeader
          title={`Import trace of ${sourceTitle}`}
          tips={`This display why [${sourceTitle}] will be imported and the packages imported by [${sourceTitle}]`}
        />
      </Chart>
    </Modal>
  )
}
