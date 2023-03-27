import { SharedColors, Stack, TooltipHost } from '@fluentui/react'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FixedSizeList } from 'react-window'

import { CommitDataFrontend } from '@perfsee/flamechart'

import { minBarWidth } from './constant'
import {
  SnapshotCommitOuter,
  SnapshotCommitInner,
  SnapshotTooltipLabel,
  SnapshotTooltipList,
  SnapshotTooltipListItem,
  SnapshotTooltipValue,
  SnapshotDurationLabel,
  SnapshotDurationList,
} from './styles'
import { formatDuration, formatTime, getGradientColor } from './util'

export interface ListProps {
  commitData: CommitDataFrontend[]
  commitTimes: Array<number>
  height: number
  filteredCommitIndices: Array<number>
  selectedCommitIndex: number | null
  selectedFilteredCommitIndex: number | null
  selectCommitIndex: (index: number) => void
  totalDurations: Array<number>
  width: number
}

export interface ItemData {
  commitTimes: Array<number>
  filteredCommitIndices: Array<number>
  maxDuration: number
  selectedCommitIndex: number | null
  selectedFilteredCommitIndex: number | null
  selectCommitIndex: (index: number) => void
  setHoveredCommitIndex: (index: number) => void
  totalDurations: Array<number>
}

export const SnapshotCommitList = ({
  commitData,
  selectedCommitIndex,
  commitTimes,
  height,
  filteredCommitIndices,
  selectedFilteredCommitIndex,
  selectCommitIndex,
  totalDurations,
  width,
}: ListProps) => {
  const listRef = useRef<FixedSizeList<ItemData> | null>(null)
  const divRef = useRef<HTMLDivElement | null>(null)
  const prevCommitIndexRef = useRef<number | null>(null)

  // Make sure a newly selected snapshot is fully visible within the list.
  useEffect(() => {
    if (selectedFilteredCommitIndex !== prevCommitIndexRef.current) {
      prevCommitIndexRef.current = selectedFilteredCommitIndex
      if (selectedFilteredCommitIndex !== null && listRef.current !== null) {
        listRef.current.scrollToItem(selectedFilteredCommitIndex)
      }
    }
  }, [listRef, selectedFilteredCommitIndex])

  const itemSize = useMemo(
    () => Math.max(minBarWidth, width / filteredCommitIndices.length),
    [filteredCommitIndices, width],
  )
  const maxDuration = useMemo(
    () => totalDurations.reduce((max, duration) => Math.max(max, duration), 0),
    [totalDurations],
  )

  const [hoveredCommitIndex, setHoveredCommitIndex] = useState<number | null>(null)

  // Pass required contextual data down to the ListItem renderer.
  const itemData = useMemo<ItemData>(
    () => ({
      commitTimes,
      filteredCommitIndices,
      maxDuration,
      selectedCommitIndex,
      selectedFilteredCommitIndex,
      selectCommitIndex,
      setHoveredCommitIndex,
      totalDurations,
    }),
    [
      commitTimes,
      filteredCommitIndices,
      maxDuration,
      selectedCommitIndex,
      selectedFilteredCommitIndex,
      selectCommitIndex,
      setHoveredCommitIndex,
      totalDurations,
    ],
  )

  const tooltipContent = useMemo(() => {
    if (hoveredCommitIndex !== null) {
      const { duration, effectDuration, passiveEffectDuration, priorityLevel, timestamp } =
        commitData[hoveredCommitIndex] || {}

      // Only some React versions include commit durations.
      // Show a richer tooltip only for builds that have that info.
      if (effectDuration !== null || passiveEffectDuration !== null || priorityLevel !== null) {
        return (
          <SnapshotTooltipList>
            {priorityLevel !== null && (
              <SnapshotTooltipListItem>
                <SnapshotTooltipLabel>Priority</SnapshotTooltipLabel>
                <SnapshotTooltipValue>{priorityLevel}</SnapshotTooltipValue>
              </SnapshotTooltipListItem>
            )}
            <SnapshotTooltipListItem>
              <SnapshotTooltipLabel>Committed at</SnapshotTooltipLabel>
              <SnapshotTooltipValue>{formatTime(timestamp)}s</SnapshotTooltipValue>
            </SnapshotTooltipListItem>
            <SnapshotTooltipListItem>
              <Stack grow={1}>
                <SnapshotTooltipLabel>Durations</SnapshotTooltipLabel>
                <SnapshotDurationList>
                  <SnapshotTooltipListItem>
                    <SnapshotDurationLabel>Render</SnapshotDurationLabel>
                    <SnapshotTooltipValue>{formatDuration(duration)}ms</SnapshotTooltipValue>
                  </SnapshotTooltipListItem>
                  {effectDuration !== null && (
                    <SnapshotTooltipListItem>
                      <SnapshotDurationLabel>Layout effects</SnapshotDurationLabel>
                      <SnapshotTooltipValue>{formatDuration(effectDuration)}ms</SnapshotTooltipValue>
                    </SnapshotTooltipListItem>
                  )}
                  {passiveEffectDuration !== null && (
                    <SnapshotTooltipListItem>
                      <SnapshotDurationLabel>Passive effects</SnapshotDurationLabel>
                      <SnapshotTooltipValue>{formatDuration(passiveEffectDuration)}ms</SnapshotTooltipValue>
                    </SnapshotTooltipListItem>
                  )}
                </SnapshotDurationList>
              </Stack>
            </SnapshotTooltipListItem>
          </SnapshotTooltipList>
        )
      } else {
        return `${formatDuration(duration)}ms at ${formatTime(timestamp)}s`
      }
    }
  }, [commitData, hoveredCommitIndex])

  const onMouseLeave = useCallback(() => {
    setHoveredCommitIndex(null)
  }, [setHoveredCommitIndex])

  const calloutProps = useMemo(() => {
    return {
      target: `#snapshot-commit-${hoveredCommitIndex}`,
    }
  }, [hoveredCommitIndex])

  return (
    <TooltipHost content={tooltipContent} calloutProps={calloutProps} delay={0}>
      <div ref={divRef} style={{ height, width }} onMouseLeave={onMouseLeave}>
        <FixedSizeList
          layout="horizontal"
          height={height}
          itemCount={filteredCommitIndices.length}
          itemData={itemData}
          itemSize={itemSize}
          ref={listRef}
          width={width}
        >
          {SnapshotCommitListItem}
        </FixedSizeList>
      </div>
    </TooltipHost>
  )
}

interface ItemProps {
  data: ItemData
  index: number
  style: any
}

const SnapshotCommitListItem = memo(({ data: itemData, index, style }: ItemProps) => {
  const ref = useRef<HTMLDivElement>(null)

  const {
    filteredCommitIndices,
    maxDuration,
    selectedCommitIndex,
    selectCommitIndex,
    setHoveredCommitIndex,
    totalDurations,
  } = itemData

  index = filteredCommitIndices[index]

  const totalDuration = totalDurations[index]

  // Use natural cbrt for bar height.
  // This prevents one (or a few) outliers from squishing the majority of other commits.
  // So rather than e.g. _█_ we get something more like e.g. ▄█_
  const heightScale = Math.min(1, Math.max(0, Math.cbrt(totalDuration) / Math.cbrt(maxDuration))) || 0

  // Use a linear scale for color.
  // This gives some visual contrast between cheaper and more expensive commits
  // and somewhat compensates for the cbrt scale height.
  const colorScale = Math.min(1, Math.max(0, totalDuration / maxDuration)) || 0

  const isSelected = selectedCommitIndex === index

  // Leave a 1px gap between snapshots
  const width = parseFloat(style.width) - 1

  const handleMouseDown = useCallback(
    ({ buttons }: any) => {
      if (buttons === 1) {
        selectCommitIndex(index)
      }
    },
    [selectCommitIndex, index],
  )

  let backgroundColor
  if (!isSelected) {
    backgroundColor = getGradientColor(colorScale)
  }

  useEffect(() => {
    if (isSelected) {
      ref.current?.scrollIntoView({ behavior: 'smooth', inline: 'center' })
    }
  }, [isSelected])

  const onMouseEnter = useCallback(() => {
    setHoveredCommitIndex(index)
  }, [setHoveredCommitIndex, index])

  return (
    <SnapshotCommitOuter
      id={`snapshot-commit-${index}`}
      onMouseDown={handleMouseDown}
      onMouseEnter={onMouseEnter}
      style={{
        ...style,
        width,
        borderBottom: isSelected ? `3px solid ${SharedColors.cyanBlue10}` : undefined,
      }}
      ref={ref}
    >
      <SnapshotCommitInner
        className={isSelected ? 'selected' : ''}
        style={{
          height: `${Math.round(heightScale * 100)}%`,
          backgroundColor,
        }}
      />
    </SnapshotCommitOuter>
  )
})
