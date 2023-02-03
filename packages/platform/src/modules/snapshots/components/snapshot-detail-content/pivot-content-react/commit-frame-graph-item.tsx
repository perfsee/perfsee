import { NeutralColors } from '@fluentui/theme'
import { memo, SyntheticEvent, useCallback } from 'react'

import { ChartNode } from './chart-node'
import { lineHeight } from './constant'
import { ItemData, ChartNode as ChartNodeType } from './types'
import { getGradientColor } from './util'

export interface Props {
  data: ItemData
  index: number
  style: any
}

export const barWidthThreshold = 2

export const CommitFlamegraphListItem = memo(({ data, index, style }: Props) => {
  const {
    chartData,
    onElementMouseEnter,
    onElementMouseLeave,
    scaleX,
    selectedChartNode,
    selectedChartNodeIndex,
    selectFiber,
    width,
  } = data
  const { renderPathNodes, maxSelfDuration, rows } = chartData

  const handleClick = useCallback(
    (event: SyntheticEvent<EventTarget>, id: number, name: string) => {
      event.stopPropagation()
      selectFiber(id, name)
    },
    [selectFiber],
  )

  const handleMouseEnter = (nodeData: ChartNodeType) => {
    const { id, name } = nodeData
    onElementMouseEnter({ id, name })
  }

  // List items are absolutely positioned using the CSS "top" attribute.
  // The "left" value will always be 0.
  // Since height is fixed, and width is based on the node's duration,
  // We can ignore those values as well.
  const top = parseInt(style.top, 10)

  const row = rows[index]

  const selectedNodeOffset = scaleX(selectedChartNode !== null ? selectedChartNode.offset : 0, width)

  return (
    <>
      {row.map((chartNode) => {
        const { didRender, id, label, name, offset, selfDuration, treeBaseDuration } = chartNode

        const nodeOffset = scaleX(offset, width)
        const nodeWidth = scaleX(treeBaseDuration, width)

        // Filter out nodes that are too small to see or click.
        // This also helps render large trees faster.
        if (nodeWidth < barWidthThreshold) {
          return null
        }

        // Filter out nodes that are outside of the horizontal window.
        if (nodeOffset + nodeWidth < selectedNodeOffset || nodeOffset > selectedNodeOffset + width) {
          return null
        }

        let color = 'url(#didNotRenderPattern)'
        let textColor = ''
        if (didRender) {
          color = getGradientColor(selfDuration / maxSelfDuration)
          textColor = NeutralColors.black
        } else if (renderPathNodes.has(id)) {
          color = NeutralColors.gray60
          textColor = NeutralColors.black
        }

        return (
          <ChartNode
            color={color}
            height={lineHeight}
            isDimmed={index < selectedChartNodeIndex}
            key={id}
            label={label}
            // eslint-disable-next-line react/jsx-no-bind
            onClick={(event) => handleClick(event, id, name)}
            // eslint-disable-next-line react/jsx-no-bind
            onMouseEnter={() => handleMouseEnter(chartNode)}
            onMouseLeave={onElementMouseLeave}
            textStyle={{ color: textColor }}
            width={nodeWidth}
            x={nodeOffset - selectedNodeOffset}
            y={top}
          />
        )
      })}
    </>
  )
})
