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

import { Theme } from '@emotion/react'
import styled from '@emotion/styled'

import { lighten } from '@perfsee/dls'

export interface TagProps {
  type?: keyof Theme['tag']
  color?: string
  borderColor?: string
  backgroundColor?: string
}

const commonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: '14px',
  height: '20px',
  lineHeight: '16px',
  padding: '2px 8px',
  borderRadius: '10px',
  border: '1px solid currentColor',
}

export const Tag = styled.span<TagProps>(({ type = 'default', color, borderColor, backgroundColor, theme }) => {
  const config = theme.tag[type]
  color = color ?? config.color
  borderColor = borderColor ?? config.borderColor ?? color
  backgroundColor = backgroundColor ?? config.backgroundColor ?? lighten(color, 0.9)

  return {
    ...commonStyle,
    color,
    borderColor,
    backgroundColor,
  }
})
