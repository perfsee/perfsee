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

import { useTheme, Theme } from '@emotion/react'
import styled from '@emotion/styled'
import { HoverCard, HoverCardType, IPlainCardProps, Stack } from '@fluentui/react'
import { useMemo } from 'react'

import { Size } from '@perfsee/shared'
import { PrettyBytes } from '@perfsee/utils'

import { DANGEROUS_SIZE_THROTTLE, WARNING_SIZE_THROTTLE } from '../constants'

export const getColor = (theme: Theme, size: number, warningThrottle: number, dangerousThrottle: number) => {
  return size >= dangerousThrottle
    ? theme.colors.error
    : size >= warningThrottle
    ? theme.colors.warning
    : theme.colors.success
}

interface Props {
  size: Size
  hoverable?: boolean
}

const Wrapper = styled('div')<{ color: string; underline?: boolean }>(({ color, underline }) => ({
  display: 'inline-block',
  color,
  textDecoration: underline ? 'underline' : 'none',
}))

const SizeLabel = styled('label')(({ theme }) => ({
  color: theme.text.colorSecondary,
  fontSize: '12px',
}))

const SizeNumber = styled('span')<{ color: string }>(({ theme, color }) => ({
  color: color ?? theme.text.colorSecondary,
  fontSize: '12px',
}))

export const ColoredSize = ({ size, hoverable = true }: Props) => {
  const theme = useTheme()

  const sizeColor = getColor(theme, size.raw, WARNING_SIZE_THROTTLE, DANGEROUS_SIZE_THROTTLE)

  const plainCardProps = useMemo<IPlainCardProps>(() => {
    return {
      onRenderPlainCard: () => {
        return (
          <Stack tokens={{ padding: 10 }}>
            {Object.entries(size).map(([key, sizeValue]) => {
              const formatted = PrettyBytes.create(sizeValue).toString()
              const color = getColor(theme, sizeValue, WARNING_SIZE_THROTTLE, DANGEROUS_SIZE_THROTTLE)

              return (
                <Stack key={key} horizontal tokens={{ childrenGap: '8px' }} verticalAlign="center">
                  <SizeLabel>{key}</SizeLabel>
                  <SizeNumber color={color}>{formatted}</SizeNumber>
                </Stack>
              )
            })}
          </Stack>
        )
      },
    }
  }, [size, theme])

  const content = useMemo(
    () => (
      <Wrapper underline={hoverable} color={sizeColor} style={{ cursor: hoverable ? 'pointer' : 'unset' }}>
        {PrettyBytes.create(size.raw).toString()}
      </Wrapper>
    ),
    [size.raw, sizeColor, hoverable],
  )

  return hoverable ? (
    <HoverCard plainCardProps={plainCardProps} type={HoverCardType.plain}>
      {content}
    </HoverCard>
  ) : (
    content
  )
}
