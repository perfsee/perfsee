import { Stack, TooltipHost } from '@fluentui/react'
import { FC, memo, useMemo } from 'react'

import { RequestTiming } from '@perfsee/flamechart'
import { RequestSchema, formatMsDuration } from '@perfsee/shared'

import { RequestPeriod, RequestPeriodMaps } from '../snapshot-type'

import { ColorDot } from './style'

interface Props {
  request: RequestSchema
  totalTime: number // Time spent on all request
  firstTime: number // The first request
  width: number // css
}

const svgHeight = 12
const MinWidth = 2

export const WaterFall: FC<Props> = memo(({ width, request, totalTime, firstTime }) => {
  const tooltipId = 'tooltip' + request.index
  const targetId = 'target' + request.index

  const timings = useMemo(() => {
    const percent = width / totalTime
    let setTarget = false
    let canMove = true
    let startX = Math.floor((request.startTime - firstTime) * percent)
    return Object.values(RequestPeriod)
      .map((key) => {
        const period = request.timings.find((v) => v.name === key)
        if (!period || period.value === 0) {
          return undefined
        }

        const length = Math.floor(period.value * percent)
        const width = Math.max(MinWidth, length)
        if (canMove && length < MinWidth) {
          startX = startX - MinWidth
          canMove = false
        } else {
          canMove = true
        }

        const height = RequestPeriodMaps[key].height
        const rect = (
          <rect
            aria-describedby={!setTarget ? tooltipId : undefined}
            id={!setTarget ? targetId : undefined}
            key={key}
            x={startX}
            y={height >= svgHeight ? 0 : (svgHeight - height) / 2}
            width={width}
            height={height}
            fill={RequestPeriodMaps[key].background}
            opacity="0.8"
          />
        )
        startX += width
        setTarget = true
        return rect
      })
      .filter(Boolean)
  }, [firstTime, request.startTime, request.timings, targetId, tooltipId, totalTime, width])

  return (
    <TooltipHost
      id="tooltip"
      calloutProps={{ target: `#${targetId}` }}
      styles={{ root: { width: '100%', display: 'inline-flex', justifyContent: 'center' } }}
      content={<WaterfallContent timing={request.timing} startTime={request.startTime} items={request.timings} />}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height={svgHeight}>
        {timings}
      </svg>
    </TooltipHost>
  )
})

type TimingsProps = {
  startTime: number
  timing: number
  items: {
    name: RequestTiming
    value: number
  }[]
}
const WaterfallContent: FC<TimingsProps> = ({ startTime, timing, items }) => {
  const list = items
    .map((t) => {
      if (t.value === 0) {
        return
      }
      return (
        <Stack tokens={{ padding: '2px 0' }} horizontal horizontalAlign="space-between" key={t.name}>
          <div>
            <ColorDot color={RequestPeriodMaps[t.name].background} />
            {t.name}:
          </div>
          {formatMsDuration(t.value, true, 2)}
        </Stack>
      )
    })
    .filter(Boolean)

  return (
    <Stack tokens={{ childrenGap: 6, padding: '4px 8px' }} styles={{ root: { minWidth: '200px' } }}>
      <span>Started at: {formatMsDuration(startTime, true, 2)}</span>
      <div>{list}</div>
      <b style={{ textAlign: 'right' }}>{formatMsDuration(timing, true)}</b>
    </Stack>
  )
}
