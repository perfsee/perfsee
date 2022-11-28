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

import { SharedColors, TooltipHost } from '@fluentui/react'

import { ProgressContainer, ProgressInner } from './style'

type Props = {
  /**
   * should between 0 - 1
   */
  percent: number

  tooltip?: string
  width?: string
  height?: string
}

export const Progress = (props: Props) => {
  const { percent, tooltip, height, width } = props

  const color = percent < 0.8 ? SharedColors.greenCyan10 : percent < 1 ? SharedColors.orange10 : SharedColors.red10

  const content = (
    <ProgressContainer width={width} height={height}>
      <ProgressInner percent={percent} color={color} />
    </ProgressContainer>
  )

  return tooltip ? (
    <TooltipHost content={tooltip} styles={{ root: { width: '100%' } }}>
      {content}
    </TooltipHost>
  ) : (
    content
  )
}
