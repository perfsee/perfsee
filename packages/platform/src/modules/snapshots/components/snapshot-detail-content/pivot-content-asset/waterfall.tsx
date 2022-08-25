import { Stack, TooltipHost } from '@fluentui/react'
import { FC, useMemo } from 'react'

import { RequestTiming } from '@perfsee/flamechart'
import { formatMsDuration } from '@perfsee/platform/common'
import { RequestSchema } from '@perfsee/shared'

import { RequestPeriod, RequestPeriodMaps } from '../../../snapshot-type'

import { ColorDot } from './style'

interface Props {
  request: RequestSchema
  totalTime: number // Time spent on all request
  firstTime: number // The first request
  width: number // css
}

const svgHeight = 12

export const WaterFall: FC<Props> = ({ width, request, totalTime, firstTime }) => {
  const timings = useMemo(() => {
    const percent = width / totalTime
    let startX = (request.startTime - firstTime) * percent

    return Object.values(RequestPeriod)
      .map((key) => {
        const period = request.timings.find((v) => v.name === key)
        if (!period || period.value === 0) {
          return undefined
        }

        const length = period.value * percent
        const height = RequestPeriodMaps[key].height
        const rect = (
          <rect
            key={key}
            x={startX}
            y={height >= svgHeight ? 0 : (svgHeight - height) / 2}
            width={length}
            height={height}
            fill={RequestPeriodMaps[key].background}
            opacity="0.8"
          />
        )
        startX += length
        return rect
      })
      .filter(Boolean)
  }, [firstTime, request.startTime, request.timings, totalTime, width])

  return (
    <TooltipHost
      styles={{ root: { width: '100%', display: 'inline-flex', justifyContent: 'center' } }}
      content={<WaterfallContent timing={request.timing} startTime={request.startTime} items={request.timings} />}
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="100%" height={svgHeight}>
        {timings}
      </svg>
    </TooltipHost>
  )
}

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
