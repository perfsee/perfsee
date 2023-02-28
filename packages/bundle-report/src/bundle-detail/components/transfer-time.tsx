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

import styled from '@emotion/styled'
import { HoverCard, HoverCardType, IPlainCardProps, Stack } from '@fluentui/react'
import { FC, useMemo } from 'react'

import { CONNECTIONS } from '@perfsee/utils'

const unit = ['ms', 'sec', 'min'] as const

export const formatTime = (time: number): { value: string; unit: 'ms' | 'sec' | 'min' } => {
  let unitIndex = 0
  if (time > 1000) {
    time /= 1000
    unitIndex += 1
    if (time > 60) {
      time /= 60
      unitIndex += 1
    }
  }
  return { value: Number.isInteger(time) ? time.toString() : time.toFixed(2), unit: unit[unitIndex] }
}

const ConnectionName = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.text.colorSecondary,
}))

const ConnectionTime = styled.span({
  fontSize: '12px',
})

const DisplayTime = styled.span<{ time: number }>(({ theme, time }) => {
  let color = theme.colors.success
  if (time > 100 && time < 300) {
    color = theme.colors.warning
  } else if (time >= 300) {
    color = theme.colors.error
  }

  return {
    color,
    textDecoration: 'underline',
  }
})

type Props = {
  size: number
}

const connections = CONNECTIONS.reduce((record, connection) => {
  record[connection.title] = connection.download
  return record
}, {} as Record<string, number>)

export const TransferTime: FC<Props> = ({ size }) => {
  const defaultTime = useMemo(() => {
    const defaultConnection = connections['WiFi'] ?? Object.values(connections)[0]
    const raw = Math.floor((size / defaultConnection) * 1000)
    return {
      ...formatTime(raw),
      raw,
    }
  }, [size])

  const plainCardProps = useMemo<IPlainCardProps>(() => {
    return {
      onRenderPlainCard: () => {
        return (
          <Stack tokens={{ padding: '10px' }}>
            {Object.keys(connections).map((key) => {
              const speed = connections[key]
              const raw = Math.floor((size / speed) * 1000)
              const time = formatTime(raw)

              return (
                <Stack key={key} horizontal tokens={{ childrenGap: '8px' }} verticalAlign="center">
                  <ConnectionName>{key}</ConnectionName>
                  <ConnectionTime>
                    {time.value}
                    {time.unit}
                  </ConnectionTime>
                </Stack>
              )
            })}
          </Stack>
        )
      },
    }
  }, [size])

  return (
    <HoverCard plainCardProps={plainCardProps} type={HoverCardType.plain}>
      <DisplayTime time={defaultTime.raw}>
        {defaultTime.value}
        {defaultTime.unit}
      </DisplayTime>
    </HoverCard>
  )
}
