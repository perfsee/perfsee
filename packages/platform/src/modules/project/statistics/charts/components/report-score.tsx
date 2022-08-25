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
import { Text } from '@fluentui/react'
import { SharedColors } from '@fluentui/theme'

const defaultFormatter = (v: number) => ({ value: v.toString(), unit: undefined })

const Primary = styled(Text)(({ color }) => ({
  fontWeight: 600,
  color,
}))

const Secondary = styled(Text)(({ color }) => ({
  opacity: 0.7,
  color,
}))

export const ReportScore: React.FunctionComponent<{
  value: number
  prev?: number | null
  formatter?: (v: number) => { value: string; unit?: string }
  comparator: (current: number, prev: number) => boolean
}> = ({ value, prev, formatter = defaultFormatter, comparator }) => {
  const isBad = value && prev && !comparator(value, prev)
  const color = isBad ? SharedColors.red10 : SharedColors.greenCyan10
  const diff = prev ? Math.round((Math.abs(value - prev) / prev) * 100) : null

  if (typeof value !== 'number') {
    return <div>-</div>
  }

  const formatted = formatter(value)

  return (
    <div>
      <Primary variant="medium">{formatted.value}</Primary>
      {formatted.unit && <Secondary variant="small"> {formatted.unit}</Secondary>}
      {diff && prev ? (
        <Secondary variant="small" color={color} block>{` ${value > prev ? '+' : '-'}${diff}%`}</Secondary>
      ) : (
        ''
      )}
    </div>
  )
}
