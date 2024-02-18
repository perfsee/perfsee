import * as React from 'react'

import { ChartNodeGroup, ChartNodeForeginObject, ChartNodeRect, ChartNodeDiv } from './styles'

type Props = {
  color: string
  height: number
  isDimmed?: boolean
  label: string
  onClick: (event: React.SyntheticEvent<any>) => void
  onDoubleClick?: (event: React.SyntheticEvent<any>) => void
  onMouseEnter: (event: React.SyntheticEvent<any>) => void
  onMouseLeave: (event: React.SyntheticEvent<any>) => void
  placeLabelAboveNode?: boolean
  textStyle?: React.CSSProperties
  width: number
  x: number
  y: number
}

const minWidthToDisplay = 35

export function ChartNode({
  color,
  height,
  isDimmed = false,
  label,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDoubleClick,
  textStyle,
  width,
  x,
  y,
}: Props) {
  return (
    <ChartNodeGroup transform={`translate(${x},${y})`}>
      <ChartNodeRect
        width={width}
        height={height}
        fill={color}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onDoubleClick={onDoubleClick}
        style={{
          opacity: isDimmed ? 0.5 : 1,
        }}
      />
      {width >= minWidthToDisplay && (
        <ChartNodeForeginObject
          width={width}
          height={height}
          style={{
            paddingLeft: x < 0 ? -x : 0,
            opacity: isDimmed ? 0.75 : 1,
            display: 'block',
          }}
          y={0}
        >
          <ChartNodeDiv style={textStyle}>{label}</ChartNodeDiv>
        </ChartNodeForeginObject>
      )}
    </ChartNodeGroup>
  )
}
