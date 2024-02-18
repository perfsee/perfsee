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
import { debounce } from 'lodash'
import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { IconWithTips } from '@perfsee/components'
import { darken } from '@perfsee/dls'
import { SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { formatTime } from '@perfsee/platform/common'
import { TimelineSchema } from '@perfsee/shared'

import { HeaderTitle } from '../style'

export const ImageCount = 10
export const ImageBoxWidth = 110
const containerPaddingLeft = 20

type Props = {
  snapshots: SnapshotDetailType[]
}

export const OverviewRenderTimelines: FC<Props> = ({ snapshots }) => {
  const [position, setPosition] = useState<number>()
  const [currentTime, setCurrentTime] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { minTime, distance } = useMemo(() => {
    const { maxTime, minTime } = snapshots.reduce(
      (p, c) => {
        if (!c.timelines || !c.timelines.length) {
          return p
        }
        p.maxTime = Math.max(p.maxTime, c.timelines[c.timelines.length - 1].timing)
        p.minTime = Math.min(p.minTime, c.timelines[0].timing)
        return p
      },
      { maxTime: 0, minTime: Infinity },
    )

    const distance = Math.ceil((maxTime - minTime) / ImageCount)

    return {
      minTime,
      distance,
    }
  }, [snapshots])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMouseMove = useCallback(
    debounce((event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      const containerLeft = (containerRef.current?.offsetLeft ?? 0) + containerPaddingLeft
      const maxTime = minTime + distance * (ImageCount - 1)
      const containerWidth = ImageCount * ImageBoxWidth
      const time = ((event.clientX - containerLeft) / containerWidth) * maxTime + minTime
      setPosition(event.clientX - containerLeft)
      setCurrentTime(time)
    }, 100),
    [],
  )

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onMouseLeave = useCallback(
    debounce(() => {
      setPosition(undefined)
    }, 300),
    [],
  )

  useEffect(() => {
    return () => {
      onMouseMove.cancel()
      onMouseLeave.cancel()
    }
  }, [onMouseLeave, onMouseMove])

  return (
    <div style={{ position: 'relative', width: `${ImageBoxWidth * ImageCount}px` }} ref={containerRef}>
      <HeaderTitle>
        Render Timeline
        <IconWithTips
          marginLeft="4px"
          content="Hover your mouse over the row of timestamps and it will show all screenshots at that time."
        />
      </HeaderTitle>
      {snapshots.map((snapshot, i) => {
        return (
          <RenderTimeline
            key={snapshot.report.id}
            index={i + 1}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
            timelines={snapshot.timelines ?? []}
            report={snapshot.report as NonNullable<SnapshotReportSchema>}
            minTime={minTime}
            distance={distance}
          />
        )
      })}
      <Stack style={{ cursor: 'pointer' }} horizontal onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
        {Array.from({ length: 10 }).map((_, i) => {
          const { value, unit } = formatTime(minTime + distance * i)
          return (
            <div key={i} style={{ width: `${ImageBoxWidth}px` }}>
              {value}
              {unit}
            </div>
          )
        })}
      </Stack>
      <TimelineDropdown snapshots={snapshots} currentTime={currentTime} position={position} />
    </div>
  )
}

type TimelineProps = {
  timelines: TimelineSchema[]
  report: NonNullable<SnapshotReportSchema>
  index: number
  minTime: number
  distance: number
  onMouseMove: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
  onMouseLeave: () => void
}

const RenderTimeline: FC<TimelineProps> = (props) => {
  const { timelines, minTime, distance, report, onMouseMove, onMouseLeave, index } = props
  const theme = useTheme()

  const result = useMemo(() => {
    const result: string[] = []
    timelines.forEach((v, i) => {
      let index = Math.floor((v.timing - minTime) / distance)
      index = index < ImageCount ? index : i
      if (!result[index]) {
        result[index] = v.data
      }

      if (i === timelines.length - 1) {
        // save the last picture
        result[index] = v.data
      }
    })

    const filteredResult = result.filter((v) => !!v)
    // insert data
    if (filteredResult.length < ImageCount) {
      const firstData = filteredResult[0]

      let i = 0
      while (i < ImageCount) {
        if (!result[i]) {
          result[i] = result[i - 1] ? result[i - 1] : firstData
        }
        i++
      }
    }
    return result
  }, [distance, minTime, timelines])

  return (
    <>
      <b>
        {index}. {report.page.name} - {report.snapshot.title ?? `Snapshot #${report.snapshot.id}`}
      </b>
      <Stack
        style={{ cursor: 'pointer' }}
        onMouseMove={onMouseMove}
        onMouseLeave={onMouseLeave}
        tokens={{ padding: '4px 0 12px 0' }}
        horizontal
      >
        {result.map((src, i) => {
          return (
            <img
              style={{ marginRight: '10px', border: `solid 1px ${theme.border.color}` }}
              width={100}
              src={src}
              alt="Snapshot"
              key={`img${i}`}
            />
          )
        })}
      </Stack>
    </>
  )
}

type DropdownProps = {
  snapshots: SnapshotDetailType[]
  currentTime: number
  position?: number
}

const TimelineDropdown: FC<DropdownProps> = ({ snapshots, currentTime, position }) => {
  const { value, unit } = formatTime(currentTime)
  const theme = useTheme()

  return (
    <>
      <Stack
        tokens={{ childrenGap: 10, padding: '4px 0' }}
        horizontalAlign="center"
        styles={{
          root: {
            position: 'absolute',
            minWidth: `${ImageBoxWidth + 40}px`,
            top: 0,
            backgroundColor: theme.colors.white,
            boxShadow: theme.boxShadowBase,
            zIndex: 2,
            pointerEvents: 'none',
            left: typeof position === 'number' ? `${position}px` : undefined,
            opacity: typeof position === 'number' ? 1 : 0,
            transition: 'left 300ms',
            '> img': {
              border: `1px solid ${darken(theme.border.color, 0.3)}`,
            },
          },
        }}
      >
        <span>
          {value}
          {unit}
        </span>
        {snapshots.map((snapshot) => {
          const timelines = snapshot.timelines ?? []
          if (!timelines.length) {
            return undefined
          }

          const timeline = timelines.reduce((p, c) => {
            if (c.timing > currentTime) {
              return p
            } else {
              return c
            }
          }, timelines[0])
          return <img width={ImageBoxWidth + 30} key={snapshot.report.id} src={timeline.data} alt="Snapshot" />
        })}
      </Stack>
    </>
  )
}
