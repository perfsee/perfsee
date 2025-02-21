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

import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { useTheme } from '@emotion/react'
import styled from '@emotion/styled'
import { HoverCard, HoverCardType, IPlainCardProps, Stack } from '@fluentui/react'
import { useMemo } from 'react'

import { PrettyBytes } from '@perfsee/utils'

import { DANGEROUS_SIZE_THROTTLE, WARNING_SIZE_THROTTLE } from '../constants'
import { Diff, Size } from '../types'

import { getColor } from './colored-size'

export type NumberDiffProps = Diff<number> & {
  showPercentile?: boolean
  lessIsGood?: boolean
  isBytes?: boolean
  hideIfNonComparable?: boolean
  hightlight?: boolean
}

const Wrapper = styled.div({
  display: 'inline-flex',
  flexDirection: 'row',
  alignItems: 'center',

  '> * + *': {
    marginLeft: '12px',
  },
})

const Color = styled.div(({ color }: { color?: string }) => ({
  color,

  '> * + *': {
    marginLeft: '6px',
  },
}))

export function NumberDiff({
  current,
  baseline,
  isBytes,
  showPercentile = true,
  lessIsGood = true,
  hideIfNonComparable = true,
  hightlight = false,
}: NumberDiffProps) {
  const theme = useTheme()

  if (!baseline || current === baseline) {
    if (hideIfNonComparable) {
      return null
    }

    return <Wrapper>-</Wrapper>
  }

  const diff = current - baseline
  const color =
    diff < 0
      ? lessIsGood
        ? theme.colors.success
        : theme.colors.error
      : lessIsGood
      ? theme.colors.error
      : theme.colors.success

  const percentile = (Math.abs(diff) / baseline) * 100

  let diffPart
  if (isBytes) {
    diffPart = <ByteSize size={diff} hightlight={hightlight} signed />
  } else {
    diffPart = (
      <span>
        {diff < 0 ? '' : '+'}
        {diff}
      </span>
    )
  }

  return (
    <Wrapper>
      <Color color={color}>
        {diffPart}
        {showPercentile && (
          <span>{baseline === 0 ? '100%' : percentile < 0.01 ? `~0.01%` : `${percentile.toFixed(2)}%`}</span>
        )}
        {diff < 0 ? <DownOutlined /> : <UpOutlined />}
      </Color>
    </Wrapper>
  )
}

export type NumberWithDiffProps = NumberDiffProps & {
  className?: string
}
export function NumberWithDiff({ current, className, ...props }: NumberWithDiffProps) {
  return (
    <Stack>
      <span className={className}>{current}</span>
      <NumberDiff current={current} hideIfNonComparable={false} {...props} />
    </Stack>
  )
}

export type ByteSizeWithDiffProps = Diff<Size> & {
  className?: string
  showDiffBellow?: boolean
  hideIfNonComparable?: boolean
  underline?: boolean
  showNewBellow?: boolean
  showNewIfIsNew?: boolean
  colored?: boolean
  horizontal?: boolean
  hoverCardHeader?: JSX.Element
}

export function ByteSizeWithDiff({
  current,
  baseline,
  className,
  showDiffBellow = true,
  underline = false,
  hideIfNonComparable = false,
  showNewIfIsNew = false,
  colored = false,
  horizontal = false,
  hoverCardHeader,
}: ByteSizeWithDiffProps) {
  const theme = useTheme()
  const plainCardProps = useMemo<IPlainCardProps>(
    () => ({
      onRenderPlainCard: () => (
        <Stack tokens={{ childrenGap: '8px', padding: '10px' }}>
          {hoverCardHeader}
          {Object.entries(current).map(([key, value]) => (
            <Stack key={key} horizontal tokens={{ childrenGap: 8 }}>
              <ByteSize label={key} size={value} hightlight />
              <NumberDiff current={value} baseline={baseline?.[key]} isBytes hightlight />
            </Stack>
          ))}
        </Stack>
      ),
    }),
    [baseline, current, hoverCardHeader],
  )

  if (showDiffBellow) {
    const numberDiff = (
      <NumberDiff current={current.raw} baseline={baseline?.raw} isBytes hideIfNonComparable={hideIfNonComparable} />
    )
    return (
      <HoverCard plainCardProps={plainCardProps} type={HoverCardType.plain}>
        <Stack horizontal={horizontal} verticalAlign="center" tokens={{ childrenGap: horizontal ? 16 : 0 }}>
          <ByteSize underline={underline} size={current.raw} className={className} colored={colored} />
          {showNewIfIsNew ? baseline ? numberDiff : <span style={{ color: theme.colors.error }}>new</span> : numberDiff}
        </Stack>
      </HoverCard>
    )
  }

  return (
    <HoverCard plainCardProps={plainCardProps} type={HoverCardType.plain}>
      <ByteSize underline={underline} size={current.raw} className={className} colored={colored} />
    </HoverCard>
  )
}

export interface ByteSizeProps {
  size: number
  label?: string
  hightlight?: boolean
  signed?: boolean
  className?: string
  underline?: boolean
  colored?: boolean
}

const ByteSizeLabel = styled('label')({})

const ByteSizeNumber = styled('span')({})

const ByteSizeUnit = styled('span')({})

const ByteSizeWrapper = styled.div<{ hightlight?: boolean; underline?: boolean }>(
  ({ hightlight, underline, theme }) => ({
    display: 'inline-block',
    cursor: 'pointer',
    ...(hightlight
      ? {
          [`${ByteSizeLabel}, ${ByteSizeUnit}`]: {
            color: theme!.text.colorSecondary,
            fontSize: '12px',
          },
          [`${ByteSizeNumber}`]: {
            fontSize: '16px',
          },
        }
      : {}),
    textDecoration: underline ? 'underline' : 'none',
  }),
)

export function ByteSize({ label, size, hightlight, signed, className, underline, colored }: ByteSizeProps) {
  const bytes = PrettyBytes.create(size, { signed })
  const theme = useTheme()

  const color = getColor(theme, size, WARNING_SIZE_THROTTLE, DANGEROUS_SIZE_THROTTLE)

  return (
    <ByteSizeWrapper hightlight={hightlight} underline={underline} style={{ color: colored ? color : 'unset' }}>
      {label && <ByteSizeLabel>{label}: </ByteSizeLabel>}
      <ByteSizeNumber className={className}>
        {bytes.prefix}
        {bytes.value}
      </ByteSizeNumber>
      <ByteSizeUnit> {bytes.unit}</ByteSizeUnit>
    </ByteSizeWrapper>
  )
}
