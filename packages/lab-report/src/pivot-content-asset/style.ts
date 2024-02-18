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

import { FilterFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { NeutralColors, Pivot, Stack } from '@fluentui/react'

import { ForeignLink } from '@perfsee/components'
import { darken } from '@perfsee/dls'

export const StyledPivot = styled(Pivot)(() => {
  return {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  }
})

export const StyledLink = styled(ForeignLink)({
  padding: '12px 0 0 16px',
  ':focus': {
    outline: 0,
  },
})

export const StyledInfoItem = styled.p(({ theme }) => ({
  padding: '8px',
  borderBottom: `1px solid ${theme.border.color}`,
  display: 'flex',
}))

export const StyledInfoKey = styled.b(() => ({
  display: 'inline-block',
  width: '240px',
  flexShrink: 0,
}))

export const RequestDesc = styled.p(({ theme }) => ({
  color: theme.text.colorSecondary,
  textAlign: 'center',
  marginTop: '12px',
}))

export const SmallText = styled.span(({ theme }) => ({
  color: theme.text.colorSecondary,
  fontSize: '12px',
  fontWeight: 600,
}))

export const ColorDot = styled.span<{ color: string }>(({ color }) => ({
  backgroundColor: color,
  width: '8px',
  height: '8px',
  borderRadius: '4px',
  display: 'inline-block',
  marginRight: '8px',
}))

export const SelectionColumn = styled(Stack)<{ selected: boolean; disabled?: boolean }>(
  ({ selected, disabled, theme }) => ({
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: disabled ? theme.colors.disabled : selected ? theme.colors.primary : theme.text.color,
    cursor: disabled ? 'not-allowed' : 'pointer',
    '> span': {
      visibility: selected ? 'initial' : 'hidden',
    },
  }),
)

export const FilterTrigger = styled.div(({ theme }) => ({
  color: theme.colors.primary,
  borderRadius: '4px',
  cursor: 'pointer',
  padding: '2px',
  '> span': {
    paddingRight: '4px',
  },
  ':hover': {
    color: darken(theme.colors.primary, 0.3),
  },
}))

const BaseIconWrap = styled.div({
  width: '20px',
  height: '20px',
  fontSize: '14px',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '3px',
  cursor: 'pointer',

  ':hover': {
    backgroundColor: NeutralColors.gray30,
  },
})

export const TableHeaderFilterIcon = styled(BaseIconWrap)({
  marginLeft: '4px',
})

export const FilteredIcon = styled(FilterFilled)(({ theme }) => ({
  color: theme.link.color,
}))
