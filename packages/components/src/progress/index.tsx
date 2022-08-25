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

import { TooltipHost } from '@fluentui/react'

import { ProgressContainer, Level } from './style'

type LevelSchema = {
  color: string
  value: number
  name?: string
}

type Props = {
  levels: LevelSchema[]
  max?: number

  width?: string
  height?: string
}

export const Progress = (props: Props) => {
  const { levels, max, height, width } = props
  const total = max ? max : levels.reduce((p, c) => p + c.value, 0)

  const items = levels.map((level, index) => {
    const width = Math.min(100, (level.value * 100) / total)
    const tooltip = level.name ? `${level.name}:${width.toFixed(2)}%` : width.toFixed(2) + '%'

    return (
      <TooltipHost styles={{ root: { height: '100%', width: `${Math.round(width)}%` } }} key={index} content={tooltip}>
        <Level color={level.color} />
      </TooltipHost>
    )
  })

  return (
    <ProgressContainer width={width} height={height}>
      {items}
    </ProgressContainer>
  )
}
