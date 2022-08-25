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
import { Text } from '@fluentui/react'
import { SharedColors } from '@fluentui/theme'
import dayjs from 'dayjs'
import { useCallback, useMemo } from 'react'

import { SimpleBarChart } from '@perfsee/components'

const Container = styled.div({
  minWidth: '200px',
  padding: '4px 8px',
})

const InfoText = styled(Text)(({ theme }) => ({
  color: theme.text.colorSecondary,
}))

interface TooltipProps {
  titleContent: React.ReactNode
  valueContent: React.ReactNode
  valueColor?: string
  idContent: React.ReactNode
  dateContent: React.ReactNode
}

const Tooltip: React.FC<TooltipProps> = ({ titleContent, valueContent, valueColor, idContent, dateContent }) => (
  <Container>
    <Text variant="medium" block>
      {titleContent}
    </Text>
    <Text variant="large" block style={{ color: valueColor }}>
      {valueContent}
    </Text>
    <br />
    <InfoText block variant="small">
      {idContent}
    </InfoText>
    <InfoText block variant="small">
      {dateContent}
    </InfoText>
  </Container>
)

interface BarChartItem {
  type: 'success' | 'failed' | 'missing'
  value?: number
  id: number
  date: string
}

interface Props {
  title: string
  items: (BarChartItem | null)[]
  valueFormatter?: (value: number) => string
  getColor?: (value: number) => string
  onRenderId?: (id: number) => React.ReactNode
  minLength?: number
  maxValue?: number
  loading?: boolean
}

export const BarChart: React.FC<Props> = ({
  title,
  items,
  valueFormatter = (value) => String(value),
  getColor,
  onRenderId = (id) => String(id),
  minLength = items.length,
  maxValue,
  loading,
}) => {
  const theme = useTheme()
  items = [...new Array(Math.max(minLength - items.length, 0)).fill(null), ...items]

  const current = items[items.length - 1]

  const getItemColor = useCallback(
    (item: BarChartItem | null) => {
      if (!item) {
        return `rgba(0,0,0,0)`
      } else if (item.type === 'success') {
        return typeof getColor === 'function' ? getColor(item.value!) : theme.colors.success
      } else if (item.type === 'failed') {
        return theme.colors.error
      } else if (item.type === 'missing') {
        return SharedColors.gray10
      }
      return `rgba(0,0,0,0)`
    },
    [getColor, theme],
  )

  const getLabelColor = useCallback(
    (item: BarChartItem | null) => {
      if (loading) {
        return `rgba(0,0,0,0)`
      }
      if (item) {
        return getItemColor(current)
      }
      return SharedColors.gray10
    },
    [current, getItemColor, loading],
  )

  const getTooltip = useCallback(
    (item: BarChartItem | null) => {
      if (!item) {
        return undefined
      } else if (item.type === 'success') {
        return (
          <Tooltip
            titleContent={title}
            valueContent={valueFormatter(item.value!)}
            valueColor={getItemColor(item)}
            idContent={onRenderId(item.id)}
            dateContent={dayjs(item.date).format('YYYY-MM-DD HH:mm:ss')}
          />
        )
      } else if (item.type === 'failed') {
        return (
          <Tooltip
            titleContent={title}
            valueContent="Failed"
            valueColor={getItemColor(item)}
            idContent={onRenderId(item.id)}
            dateContent={dayjs(item.date).format('YYYY-MM-DD HH:mm:ss')}
          />
        )
      } else if (item.type === 'missing') {
        return (
          <Tooltip
            titleContent={title}
            valueContent="Missing"
            valueColor={getItemColor(item)}
            idContent={onRenderId(item.id)}
            dateContent={dayjs(item.date).format('YYYY-MM-DD HH:mm:ss')}
          />
        )
      }
    },
    [getItemColor, onRenderId, title, valueFormatter],
  )

  const data = useMemo(() => {
    return items.map((item) => ({
      value: item?.value ?? 0,
      color: getItemColor(item),
      tooltip: () => getTooltip(item),
    }))
  }, [getItemColor, getTooltip, items])

  return (
    <SimpleBarChart
      label={current?.value ? valueFormatter(current.value) : 'No Data'}
      labelColor={getLabelColor(current)}
      items={data}
      maxValue={maxValue}
      loading={loading}
    />
  )
}
