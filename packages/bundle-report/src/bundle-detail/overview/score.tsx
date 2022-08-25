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
import styled from '@emotion/styled'
import { Stack } from '@fluentui/react'

import { CircleWrapper, ColorfulDot } from '@perfsee/components/donut-chart/style'

import { NumberDiff } from '../components'

const Score = styled.span({
  fontSize: '36px',
  fontWeight: '600',
})

export function ScoreCircle({ score, baseline }: { score: number; baseline?: number }) {
  const theme = useTheme()
  const perimeter = Math.PI * 16

  const scoreRanges = [
    {
      max: 100,
      min: 80,
      name: 'Good',
      color: theme.colors.success,
    },
    {
      max: 79,
      min: 60,
      name: 'Medium',
      color: theme.colors.warning,
    },
    {
      max: 59,
      min: 0,
      name: 'Poor',
      color: theme.colors.error,
    },
  ]

  const scoreColor = scoreRanges.find(({ min }) => {
    return score >= min
  })!.color

  return (
    <Stack horizontal horizontalAlign="center" verticalAlign="center" tokens={{ childrenGap: '24px' }}>
      <CircleWrapper>
        <svg viewBox="0 0 20 20" style={{ transform: 'rotate(-90deg)' }}>
          <circle fill="none" cx="10" cy="10" r="8" strokeWidth={2} stroke={theme.colors.secondary} />
          <circle
            fill="none"
            cx="10"
            cy="10"
            r="8"
            strokeWidth={2}
            stroke={scoreColor}
            strokeDasharray={perimeter}
            strokeDashoffset={(1 - score / 100) * perimeter}
          />
        </svg>
        <Stack
          verticalAlign="center"
          horizontalAlign="center"
          styles={{
            root: {
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            },
          }}
        >
          <Score>{score}</Score>
          <NumberDiff current={score} baseline={baseline} showPercentile={false} lessIsGood={false} />
        </Stack>
      </CircleWrapper>
      <Stack tokens={{ childrenGap: '8px' }}>
        {scoreRanges.map(({ max, min, name, color }) => (
          <Stack key={name} horizontal verticalAlign="center" tokens={{ childrenGap: '8px' }}>
            <ColorfulDot color={color} />
            <span style={{ minWidth: '64px' }}>{name}</span>
            <span>
              {min} - {max}
            </span>
          </Stack>
        ))}
      </Stack>
    </Stack>
  )
}
