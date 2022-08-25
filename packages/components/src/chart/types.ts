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

import type { CustomSeriesOption } from 'echarts/charts'
import type { TooltipComponentOption } from 'echarts/components'
import type { ECharts as EChartsInstance } from 'echarts/core'
import { CSSProperties } from 'react'

import { EChartsOption } from './init'

export type { ECharts as EChartsInstance } from 'echarts/core'

export type Opts = {
  readonly devicePixelRatio?: number
  readonly renderer?: 'canvas' | 'svg'
  readonly width?: number
  readonly height?: number
  readonly locale?: string
}

export type EChartsReactProps = {
  /**
   * `className` for container
   */
  readonly className?: string
  /**
   * `style` for container
   */
  readonly style?: CSSProperties
  /**
   * echarts option
   */
  readonly option: EChartsOption
  /**
   * echarts theme config, can be:
   * 1. theme name string
   * 2. theme object
   */
  readonly theme?: string | Record<string, any>
  /**
   * notMerge config for echarts, default is `false`
   */
  readonly notMerge?: boolean
  /**
   * lazyUpdate config for echarts, default is `false`
   */
  readonly lazyUpdate?: boolean
  /**
   * showLoading config for echarts, default is `false`
   */
  readonly showLoading?: boolean
  /**
   * loadingOption config for echarts, default is `null`
   */
  readonly loadingOption?: any
  /**
   * echarts opts config, default is `{}`
   */
  readonly opts?: Opts
  /**
   * when after chart reander, do the callback widht echarts instance
   */
  readonly onChartReady?: (instance: EChartsInstance) => void
  /**
   * bind events, default is `{}`
   */
  readonly onEvents?: Record<string, (param: ChartEventParam) => void>
  /**
   * should update echarts options
   */
  readonly shouldSetOption?: (prevProps: EChartsReactProps, props: EChartsReactProps) => boolean
}

type Unified<T> = Exclude<T, T[]>

export type TooltipRendererCallback = Exclude<NonNullable<TooltipComponentOption['formatter']>, string>

export type TooltipRendererParam = Parameters<TooltipRendererCallback>[0]
export type SingleTooltipRendererParam = Unified<TooltipRendererParam>

export type CustomRenderCallback = NonNullable<CustomSeriesOption['renderItem']>

export type ChartEventParam = {
  dataType: string
  type: string
  data: any
  name: string
  seriesName: string
}
