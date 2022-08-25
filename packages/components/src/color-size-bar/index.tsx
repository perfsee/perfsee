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
import { TooltipHost, Stack, ITooltipHostStyles } from '@fluentui/react'
import { useMemo } from 'react'

import { NeutralColors } from '@perfsee/dls'

export type ColorSchema = {
  foreground: string
  background: string
}

const getTooltipHostStyles = (
  type: string,
  width: string,
  colorMaps: Record<string, ColorSchema>,
): ITooltipHostStyles => {
  const { foreground, background } = colorMaps[type] ?? {
    foreground: NeutralColors.white,
    background: NeutralColors.black,
  }
  return {
    root: {
      textAlign: 'center',
      lineHeight: '48px',
      height: '48px',
      width: `calc(${width} + 5px)`,
      backgroundColor: background,
      fontWeight: 'bold',
      color: foreground,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whitSpace: 'nowrap',
    },
  }
}

export const RequestLabelDot = styled.span<{ color: string }>(({ color }) => {
  return {
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    marginRight: '4px',
    marginLight: '4px',
    backgroundColor: color,
  }
})

type Props = {
  aggregated: { type: string; value: number }[]
  total: number
  withTag?: boolean
  title?: string
  colorMaps: Record<string, ColorSchema>
  renderContent?: (type: string, value: number) => string
  renderTooltip?: (type: string, value: number) => string
}

export const ColorfulSizeBar = (props: Props) => {
  const { aggregated, total, colorMaps, renderTooltip, renderContent } = props
  const sizeBar = useMemo(
    () => (
      <Stack styles={{ root: { width: '100%', minHeight: '50px' } }} horizontal={true}>
        {aggregated.map(({ type, value }) => {
          const percentileNum = (value / total) * 100
          const percentile = `${percentileNum.toFixed(2)}%`
          const { foreground, background } = colorMaps[type] ?? {
            foreground: NeutralColors.white,
            background: NeutralColors.black,
          }
          const content = renderContent ? renderContent(type, value) : type.toUpperCase()
          const tooltip = renderTooltip ? renderTooltip(type, value) : `${type.toUpperCase()}: ${percentile}`

          return (
            <TooltipHost key={type} content={tooltip} styles={getTooltipHostStyles(type, percentile, colorMaps)}>
              <span css={{ background, color: foreground, height: '100%', fontWeight: 'bold' }}>
                {percentileNum > 6 && content}
              </span>
            </TooltipHost>
          )
        })}
      </Stack>
    ),
    [aggregated, colorMaps, renderContent, renderTooltip, total],
  )
  if (!props.withTag) {
    return sizeBar
  }

  return (
    <div>
      <Stack horizontal horizontalAlign="space-between" style={{ marginBottom: '8px' }}>
        <h3>{props.title}</h3>
        <div>
          {aggregated.map((item) => {
            const color = colorMaps[item.type]?.background ?? NeutralColors.black
            return (
              <span style={{ paddingRight: '12px' }} key={item.type}>
                <RequestLabelDot color={color} />
                {item.type}
              </span>
            )
          })}
        </div>
      </Stack>
      <Stack horizontal>{sizeBar}</Stack>
    </div>
  )
}
