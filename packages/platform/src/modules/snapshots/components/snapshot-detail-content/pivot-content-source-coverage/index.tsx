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

import { Spinner, SpinnerSize } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useEffect, useState } from 'react'

import { useWideScreen } from '@perfsee/components'
import { TreeMapChart } from '@perfsee/components/treemap'
import { hierarchy, HierarchyNode } from '@perfsee/treemap'

import { SnapshotDetailType, SnapshotReportSchema } from '../../../snapshot-type'

import { SourceCoverageModule } from './module'
import { LegendList, UsedLegendIcon, UnusedLegendIcon, ChartContainer } from './style'
import { SourceCoverageTooltip } from './tooltip'

type Props = {
  snapshot: SnapshotDetailType
}

type SourceCoverageTreeMapData = LH.Treemap.Node & { highlight?: number }

export const SourceCoveragePivotContent = (props: Props) => {
  useWideScreen()
  const [treeMapData, setTreeMapData] = useState<HierarchyNode<SourceCoverageTreeMapData>>()
  const storageKey = (props.snapshot.report as SnapshotReportSchema)?.sourceCoverageStorageKey
  const [{ data, loading }, dispatcher] = useModule(SourceCoverageModule)

  useEffect(() => {
    if (storageKey) {
      dispatcher.fetchSourceCoverageResult(storageKey)
    }
  }, [dispatcher, storageKey])

  useEffect(() => {
    return dispatcher.reset
  }, [dispatcher.reset])

  useEffect(() => {
    if (data) {
      const nodes = data.lhr.audits['script-treemap-data'].details.nodes
      const totalBytes = nodes.reduce((p, c) => c.resourceBytes + p, 0)
      const totalUnusedBytes = nodes.reduce((p, c) => (c.unusedBytes ?? 0) + p, 0)
      const treeMapData = hierarchy<SourceCoverageTreeMapData>({
        name: data.lhr.requestedUrl,
        resourceBytes: totalBytes,
        unusedBytes: totalUnusedBytes,
        color: '#ffffff',
        children: data.lhr.audits['script-treemap-data'].details.nodes,
      })
        .sum((d) => (d.children ? 0 : d.resourceBytes || 0))
        .sort((a, b) => b.data.resourceBytes - a.data.resourceBytes)
        .each((node) => {
          node.data.highlight = ((node.data.unusedBytes ?? 0) / node.data.resourceBytes) * -1
        })
      setTreeMapData(treeMapData)
    }
  }, [data])

  if (loading) {
    return <Spinner size={SpinnerSize.large} />
  }

  return (
    <>
      <LegendList>
        <UsedLegendIcon />
        Used
        <UnusedLegendIcon />
        Unused
      </LegendList>
      <ChartContainer>
        {treeMapData && <TreeMapChart data={treeMapData} tooltip={SourceCoverageTooltip} />}
      </ChartContainer>
    </>
  )
}
