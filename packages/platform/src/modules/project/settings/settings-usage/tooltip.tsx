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

import { Stack, Text } from '@fluentui/react'
import { FC } from 'react'

import { TooltipItemColor } from './style'
import { formatUsage, USAGE_FORMAT } from './utils'

interface TimeUsageToolTipProps {
  title: string
  formatType: USAGE_FORMAT
  items: {
    color: string
    name: string
    value: number
  }[]
}

export const TimeUsageToolTip: FC<TimeUsageToolTipProps> = ({ title, items, formatType }) => {
  const renderItems = [
    { name: 'Total', value: items.reduce((acc, item) => acc + item.value, 0), color: '#ccc' },
  ].concat(items)

  return (
    <>
      <Text>{title}</Text>
      {renderItems.map(({ color, name, value }) => (
        <TooltipItem key={name} color={color} name={name} value={value} formatType={formatType} />
      ))}
    </>
  )
}

const TooltipItem = ({
  color,
  name,
  value,
  formatType,
}: {
  color: string
  name: string
  value: number
  formatType: USAGE_FORMAT
}) => {
  return (
    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }} styles={{ root: { minWidth: 150 } }}>
      <TooltipItemColor color={color} />
      <Stack.Item grow>
        <Text>{name}</Text>
      </Stack.Item>
      <Stack.Item>
        <Text>{formatUsage(value, formatType, true)}</Text>
      </Stack.Item>
    </Stack>
  )
}
