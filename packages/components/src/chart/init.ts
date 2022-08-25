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

import { LineChart, PieChart, TreemapChart, GraphChart, RadarChart, BarChart, CustomChart } from 'echarts/charts'
import type {
  LineSeriesOption,
  PieSeriesOption,
  TreemapSeriesOption,
  GraphSeriesOption,
  RadarSeriesOption,
  BarSeriesOption,
  CustomSeriesOption,
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DatasetComponent,
  MarkLineComponent,
  ToolboxComponent,
} from 'echarts/components'
import type {
  TitleComponentOption,
  TooltipComponentOption,
  LegendComponentOption,
  GridComponentOption,
  DatasetComponentOption,
  MarkLineComponentOption,
  ToolboxComponentOption,
} from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { once } from 'lodash'

export { LineSeriesOption, CustomSeriesOption }

export const initEchart = once(() => {
  echarts.use([
    LineChart,
    PieChart,
    TreemapChart,
    GraphChart,
    RadarChart,
    BarChart,
    CustomChart,

    TitleComponent,
    TooltipComponent,
    GridComponent,
    DatasetComponent,
    LegendComponent,
    MarkLineComponent,
    ToolboxComponent,

    CanvasRenderer,
  ])
})

export type EChartsOption = echarts.ComposeOption<
  | LineSeriesOption
  | PieSeriesOption
  | TreemapSeriesOption
  | GraphSeriesOption
  | RadarSeriesOption
  | BarSeriesOption
  | CustomSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
  | LegendComponentOption
  | MarkLineComponentOption
  | ToolboxComponentOption
>
