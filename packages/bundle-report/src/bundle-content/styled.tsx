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
import { Stack } from '@fluentui/react'
import { NeutralColors, SharedColors } from '@fluentui/theme'

export const Container = styled.div({
  display: 'flex',
  flexDirection: 'column',
})

export const Header = styled.div({
  flexShrink: 0,
  flexBasis: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: '8px 0',
  padding: '0 24px',

  a: {
    height: '16px',
    lineHeight: 1,
  },

  'span + span': {
    marginLeft: '8px',
  },
})

export const ChartWrapper = styled.div({
  flexGrow: 1,
  // pageHeight - top nav - header - footer
  height: 'calc(100vh - 110px - 50px - 160px)',
})

export const ShortcutTips = styled.div({
  fontSize: '12px',
  color: SharedColors.gray30,
})

export const TreeviewColumnCell = styled(Stack)<{ concatenated?: boolean; lastChild?: boolean }>(
  ({ concatenated, lastChild }) => {
    const extra = concatenated
      ? ({
          '::before': {
            content: '""',
            display: 'block',
            position: 'absolute',
            left: -19,
            top: 0,
            height: lastChild ? 22 : 32,
            width: 2,
            backgroundColor: NeutralColors.gray20,
          },
        } as const)
      : {}

    return {
      width: '100%',

      'span[role="icon"]': {
        display: 'none',
        color: NeutralColors.gray120,
      },

      '&:hover span[role="icon"]': {
        display: 'unset',
      },

      ...extra,
    }
  },
)

export const ModuleLabel = styled.span<{ warning?: boolean; color?: string }>(({ theme, warning, color }) => ({
  fontSize: 10,
  display: 'inline-block',
  padding: '0 4px',
  color: 'white',
  backgroundColor: warning ? theme.colors.warning : color,
  borderRadius: 4,
}))

export const LegendList = styled.div({
  height: '32px',
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
  padding: '0 32px',
  fontWeight: 600,
})

export const UnusedLegendIcon = styled.div({
  width: '24px',
  height: '24px',
  margin: '0 16px',
  background:
    'repeating-linear-gradient( -45deg, hsla(0, 0%, 0%, 0), hsla(0, 0%, 0%, 0) 2px, hsla(7, 85%, 56%, 0.3) 2px, hsla(7, 85%, 56%, 0.3) 4px )',
})

export const ChartContainer = styled.div({
  width: '100%',
  height: 'calc(100vh - 350px)',
})
