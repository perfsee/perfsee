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

import { Stack, Spinner, SpinnerSize } from '@fluentui/react'
import { has } from 'lodash'
import { FC, ReactNode, useMemo } from 'react'

import { Empty } from '../empty'

import { BaseChart } from './base-chart'
import { EChartsOption, initEchart } from './init'
import { CardWrapper } from './style'
import { EChartsReactProps } from './types'

type Props = {
  hideBorder?: boolean
  children?: ReactNode
  mergeCustomOption?: boolean
} & EChartsReactProps

initEchart()

const defaultOption: EChartsOption = {
  xAxis: {
    type: 'category',
    boundaryGap: false,
  },
  yAxis: {},
  legend: {
    type: 'scroll',
    bottom: 0,
  },
  tooltip: {
    trigger: 'axis',
    enterable: true,
    position: (point, _, __, ___, { contentSize, viewSize }) => ({
      top: 10,
      left: point[0] < viewSize[0] / 2 ? point[0] : point[0] - contentSize[0],
    }),
  },
  grid: {
    containLabel: true,
    top: '20px',
    bottom: '30px',
    left: '10px',
    right: '40px',
  },
}

const mergeOptions = (option: EChartsOption) => {
  Object.entries(defaultOption).forEach(([key, optionValue]) => {
    if (has(option, key)) {
      option[key] = {
        ...(optionValue as Record<string, unknown>),
        ...(option[key] as Record<string, unknown>),
      }
    } else {
      option[key] = optionValue
    }
  })

  return option
}

export const Chart: FC<Props> = (props) => {
  const { hideBorder, children, showLoading, option, mergeCustomOption = true, ...chartProps } = props

  const realOption = useMemo(() => {
    return mergeCustomOption ? mergeOptions(option) : option
  }, [mergeCustomOption, option])

  const isEmptyData = useMemo(() => {
    if (!option) {
      return true
    }

    const { series, dataset } = option

    if (!series && !dataset) {
      return true
    }

    if (series) {
      if (Array.isArray(series)) {
        return series.every((item) => !item.data)
      }

      return !series.data
    }

    if (dataset) {
      if (Array.isArray(dataset)) {
        return dataset.every((item) => !item.source)
      }

      return !dataset.source
    }
  }, [option])

  const content = useMemo(
    () =>
      showLoading ? (
        <Spinner size={SpinnerSize.large} />
      ) : isEmptyData ? (
        <Empty title="No Data" withIcon={true} />
      ) : (
        <BaseChart {...chartProps} option={realOption} />
      ),
    [chartProps, isEmptyData, realOption, showLoading],
  )

  return (
    <CardWrapper hideBorder={!!hideBorder}>
      {children}
      <Stack horizontalAlign="center" verticalAlign="center">
        {content}
      </Stack>
    </CardWrapper>
  )
}
