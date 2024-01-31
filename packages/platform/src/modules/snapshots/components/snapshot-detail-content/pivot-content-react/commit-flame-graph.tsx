import { NeutralColors, Stack } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { forwardRef, useCallback, useMemo, useState, ReactNode, MouseEvent, CSSProperties } from 'react'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'

import { Hovertip } from '@perfsee/flamechart/components/hovertip'
import { Vec2 } from '@perfsee/flamechart/lib/math'
import { lightTheme } from '@perfsee/flamechart/themes/light-theme'

import { CommitFlamegraphListItem } from './commit-frame-graph-item'
import { lineHeight } from './constant'
import { ReactFlameGraphModule } from './module'
import { GraphItemComponent, GraphItemContent, GraphItemCurrentCommit, GraphItemToolbar } from './styles'
import { CommitFlameGraphProps, TooltipFiberData, ItemData } from './types'
import { formatDuration, scale } from './util'
import { WhatChanged } from './what-changed'

const containerTokens = {
  padding: '0.5rem',
}

const containerStyles: CSSProperties = {
  width: '100%',
  flex: 1,
}

export const CommitFlameGraph = ({ chartData }: CommitFlameGraphProps) => {
  const [{ selectedFiberID }, dispatcher] = useModule(ReactFlameGraphModule)
  const { selectFiber } = dispatcher
  const [hoveredFiberData, setHoveredFiberData] = useState<TooltipFiberData | null>(null)
  const [tooltipOffset, setTooltipOffset] = useState<Vec2 | undefined>()

  const selectedChartNodeIndex = useMemo<number>(() => {
    if (selectedFiberID === null) {
      return 0
    }
    // The selected node might not be in the tree for this commit,
    // so it's important that we have a fallback plan.
    const depth = chartData.idToDepthMap.get(selectedFiberID)
    return depth !== undefined ? depth - 1 : 0
  }, [chartData, selectedFiberID])

  const selectedChartNode = useMemo(() => {
    if (selectedFiberID !== null) {
      return chartData.rows[selectedChartNodeIndex].find((chartNode) => chartNode.id === selectedFiberID) || null
    }
    return null
  }, [chartData, selectedFiberID, selectedChartNodeIndex])

  const handleElementMouseEnter = useCallback(({ id, name }: TooltipFiberData) => {
    setHoveredFiberData({ id, name }) // Set hovered fiber data for tooltip
  }, [])

  const handleElementMouseLeave = useCallback(() => {
    setHoveredFiberData(null) // clear hovered fiber data for tooltip
  }, [])

  const tooltipLabel = useMemo(
    () => (hoveredFiberData !== null ? <HoveredFiberInfo fiberData={hoveredFiberData} /> : undefined),
    [hoveredFiberData],
  )

  const tooltip = (
    <Hovertip theme={lightTheme} offset={tooltipOffset}>
      {tooltipLabel}
    </Hovertip>
  )

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      setTooltipOffset(new Vec2(e.clientX, e.clientY))
    },
    [setTooltipOffset],
  )

  return (
    <Stack tokens={containerTokens} onMouseMove={onMouseMove} style={containerStyles}>
      {tooltip}
      <AutoSizer>
        {({ height, width }: { height: number; width: number }) => {
          const itemData: ItemData = {
            chartData,
            onElementMouseEnter: handleElementMouseEnter,
            onElementMouseLeave: handleElementMouseLeave,
            scaleX: scale(
              0,
              selectedChartNode !== null ? selectedChartNode.treeBaseDuration : chartData.baseDuration,
              0,
              width,
            ),
            selectedChartNode,
            selectedChartNodeIndex,
            selectFiber: (id, name) => selectFiber({ id, name }),
            width,
          }
          return (
            <FixedSizeList
              height={height}
              innerElementType={InnerElementType}
              itemCount={chartData.depth}
              itemData={itemData}
              itemSize={lineHeight}
              width={width}
            >
              {CommitFlamegraphListItem}
            </FixedSizeList>
          )
        }}
      </AutoSizer>
    </Stack>
  )
}

const InnerElementType = forwardRef<SVGSVGElement, { children: ReactNode }>(({ children, ...rest }, ref) => (
  <svg ref={ref} {...rest}>
    <defs>
      <pattern id="didNotRenderPattern" patternUnits="userSpaceOnUse" width="4" height="4">
        <path d="M-1,1 l2,-2 M0,4 l4,-4 M3,5 l2,-2" style={{ stroke: NeutralColors.gray60, strokeWidth: 1 }} />
      </pattern>
    </defs>
    {children}
  </svg>
))

interface HoveredFiberInfoProps {
  fiberData: TooltipFiberData
}

const HoveredFiberInfo = ({ fiberData }: HoveredFiberInfoProps) => {
  const { id, name } = fiberData
  const { reactProfile, rootID, selectedCommitIndex } = useModuleState(ReactFlameGraphModule)

  const commitIndices = useMemo(() => {
    const fiberCommits: number[] = []
    reactProfile?.dataForRoots.get(rootID)?.commitData.forEach((commitDatum, commitIndex) => {
      if (commitDatum.fiberActualDurations.get(id)) {
        fiberCommits.push(commitIndex)
      }
    })

    return fiberCommits
  }, [reactProfile, rootID, id])

  const renderDurationInfo = useMemo(() => {
    let i = 0
    for (i = 0; i < commitIndices.length; i++) {
      const commitIndex = commitIndices[i]
      if (selectedCommitIndex === commitIndex) {
        const { fiberActualDurations, fiberSelfDurations } =
          reactProfile?.dataForRoots.get(rootID)?.commitData[commitIndex] || {}
        const actualDuration = fiberActualDurations?.get(id) || 0
        const selfDuration = fiberSelfDurations?.get(id) || 0

        return (
          <GraphItemCurrentCommit key={commitIndex}>
            {formatDuration(selfDuration)}ms of {formatDuration(actualDuration)}ms
          </GraphItemCurrentCommit>
        )
      }
    }

    return null
  }, [reactProfile, rootID, commitIndices, selectedCommitIndex, id])

  return (
    <>
      <GraphItemToolbar>
        <GraphItemComponent>{name}</GraphItemComponent>
      </GraphItemToolbar>
      <GraphItemContent>
        {renderDurationInfo || <div>Did not render.</div>}
        <WhatChanged fiberID={id} />
      </GraphItemContent>
    </>
  )
}
