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

import { DirectionalHint, IRectangle, SharedColors, Tooltip } from '@fluentui/react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { SimpleBarChartContainer, SimpleBarChartItem, SimpleBarChartValueText, SimpleBarChartProgress } from './style'

export interface SimpleBarChartItem {
  color: string
  value: number
  tooltip?: () => JSX.Element | undefined
}

export interface SimpleBarChartProps {
  items: SimpleBarChartItem[]
  maxValue?: number
  label: string
  labelColor: string
  loading?: boolean
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ items, maxValue, loading, label, labelColor }) => {
  const values = items.map((item) => item.value)
  const ensureMaxValue = maxValue ?? values.reduce((pre, curr) => (curr > pre ? curr : pre), -Infinity)
  const heights = values.map((value) => (value / ensureMaxValue) * 100 + '%')

  const [tooltipMouse, setTooltipMouse] = useState<boolean>(false)
  const [barchartMouse, setBarchartMouse] = useState<boolean>(false)
  const [tooltipTarget, setTooltipTarget] = useState<{ bounding: IRectangle; content: JSX.Element } | null>(null)
  const [tooltipVisible, setTooltipVisiable] = useState<boolean>(false)

  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseOut = useCallback((ev: MouseEvent) => {
    const element = ev.target as HTMLElement
    const index = element.dataset.barchartIndex
    if (index) {
      setBarchartMouse(false)
    }
  }, [])

  const handleMouseOver = useCallback(
    (ev: MouseEvent) => {
      const element = ev.target as HTMLElement
      const index = element.dataset.barchartIndex
      if (index) {
        setBarchartMouse(true)
        const bounding = element.getBoundingClientRect()
        const tooltip = items[parseInt(index)].tooltip
        const content = tooltip?.()
        if (content) {
          setTooltipTarget({ bounding, content })
        } else {
          setTooltipTarget(null)
        }
      }
    },
    [items],
  )

  const handleTooltipMouseEnter = useCallback(() => {
    setTooltipMouse(true)
  }, [])

  const handleTooltipMouseLeave = useCallback(() => {
    setTooltipMouse(false)
  }, [])

  useEffect(() => {
    const containerElement = containerRef.current
    containerElement?.addEventListener('mouseout', handleMouseOut)
    containerElement?.addEventListener('mouseover', handleMouseOver)
    return () => {
      containerElement?.removeEventListener('mouseout', handleMouseOut)
      containerElement?.removeEventListener('mouseover', handleMouseOver)
    }
  }, [handleMouseOut, handleMouseOver])

  const tooltipDismissTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (tooltipDismissTimeoutRef.current) {
      clearTimeout(tooltipDismissTimeoutRef.current)
    }

    if ((tooltipMouse || barchartMouse) && tooltipTarget) {
      setTooltipVisiable(true)
    } else {
      tooltipDismissTimeoutRef.current = setTimeout(() => {
        setTooltipVisiable(false)
      }, 50)
    }
  }, [barchartMouse, tooltipMouse, tooltipTarget])

  return (
    <SimpleBarChartContainer loadingAnimation={loading} ref={containerRef}>
      {heights.map((height, index) => (
        <SimpleBarChartItem key={index} data-barchart-index={index}>
          <SimpleBarChartProgress
            height={!loading ? height : '100%'}
            color={!loading ? items[index].color : SharedColors.gray10}
          />
        </SimpleBarChartItem>
      ))}
      <SimpleBarChartValueText style={{ color: labelColor }}>{label}</SimpleBarChartValueText>
      {tooltipVisible && tooltipTarget && (
        <Tooltip
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
          calloutProps={{
            directionalHint: DirectionalHint.bottomLeftEdge,
            isBeakVisible: false,
            gapSpace: 0,
            target: tooltipTarget.bounding,
          }}
          content={tooltipTarget.content}
          styles={{ root: { ':after': { inset: '0px' } } }}
        />
      )}
    </SimpleBarChartContainer>
  )
}
