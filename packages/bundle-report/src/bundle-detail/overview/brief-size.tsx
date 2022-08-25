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

import { useTheme } from '@emotion/react'
import { Stack } from '@fluentui/react'
import { useMemo } from 'react'

import { FileColorsMaps, DonutChart } from '@perfsee/components'
import { addSize, AssetInfo, AssetTypeEnum, getDefaultSize, Size } from '@perfsee/shared'

import { ByteSizeWithDiff, NumberDiff } from '../components'
import { EntryDiff, Diff } from '../types'

import { EmphasisSizeDiff } from './style'

interface BriefSizeProps {
  diff: EntryDiff
}

export function BriefSize({ diff }: BriefSizeProps) {
  return (
    <Stack horizontal verticalAlign="center" horizontalAlign="center" wrap tokens={{ childrenGap: '32px' }}>
      <TotalSize sizeDiff={diff.sizeDiff} />
      <SizeByType assetsDiff={diff.assetsDiff} total={diff.sizeDiff} />
    </Stack>
  )
}

function TotalSize({ sizeDiff }: { sizeDiff: Diff<Size> }) {
  const theme = useTheme()
  return (
    <Stack
      verticalAlign="center"
      horizontalAlign="center"
      styles={{
        root: {
          minHeight: '100px',
          paddingRight: '32px',
          borderRight: `1px solid ${theme.border.color}`,
        },
      }}
    >
      <EmphasisSizeDiff current={sizeDiff.current} baseline={sizeDiff.baseline} />
    </Stack>
  )
}

type TypeAggregatedSize = {
  [key in AssetTypeEnum]: Size
}

function calcAssetsSize(assets: AssetInfo[] = []): TypeAggregatedSize {
  const defaultSize = Object.values(AssetTypeEnum).reduce((acc, type) => {
    acc[type] = getDefaultSize()
    return acc
  }, {}) as TypeAggregatedSize

  return assets.reduce((prev, asset) => {
    if (asset.intermediate) return prev

    prev[asset.type] = addSize(asset.size, prev[asset.type])
    return prev
  }, defaultSize)
}

function SizeByType({ assetsDiff, total }: { assetsDiff: Diff<AssetInfo[]>; total: Diff<Size> }) {
  const { current, baseline } = useMemo(
    () => ({
      current: calcAssetsSize(assetsDiff.current),
      baseline: assetsDiff.baseline ? calcAssetsSize(assetsDiff.baseline) : null,
    }),
    [assetsDiff],
  )

  const chartData = useMemo(() => {
    return Object.entries(AssetTypeEnum).map(([typeName, type]) => {
      return {
        key: type,
        name: typeName,
        value: current[type].raw,
        color: FileColorsMaps[type].background,
        extraLegend: <Legend current={current[type]} baseline={baseline?.[type]} />,
      }
    })
  }, [baseline, current])

  return (
    <Stack horizontal tokens={{ childrenGap: 24 }}>
      <DonutChart showEmpty={true} showLegend={true} data={chartData} total={total.current.raw} />
    </Stack>
  )
}

type LegendProps = { current: Size; baseline?: Size }
const Legend = ({ current, baseline }: LegendProps) => {
  return (
    <>
      <td className="size">
        <ByteSizeWithDiff current={current} baseline={baseline} showDiffBellow={false} />
      </td>
      <td className="diff">
        <NumberDiff current={current.raw} baseline={baseline?.raw} isBytes hideIfNonComparable={false} />
      </td>
    </>
  )
}
