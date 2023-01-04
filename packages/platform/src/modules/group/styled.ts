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

import { lighten } from '@perfsee/dls'

export const ColoredDiff = styled.span<{ diff: number }>(({ diff, theme }) => {
  const color = diff > 0 ? theme.colors.success : theme.colors.error
  return {
    marginLeft: '4px',
    padding: '2px 6px',
    borderRadius: '4px',

    color: color,
    backgroundColor: lighten(color, 0.9),
  }
})

export const UnderlineText = styled.span({
  textDecoration: 'underline',
})

export const NavContainer = styled.div(({ theme }) => ({
  height: '44px',
  position: 'sticky',
  top: theme.layout.headerHeight,
  zIndex: 3,
  backgroundColor: theme.colors.white,
  padding: `0 ${theme.layout.mainPadding}`,
}))

export const ChartsContainer = styled.div({ marginTop: '12px' })

export const ColorSpan = styled.span<{ good: boolean }>(({ good, theme }) => ({
  color: good ? theme.colors.success : theme.colors.error,
}))

export const OperationSpan = styled.span(({ theme }) => ({
  cursor: 'pointer',
  userSelect: 'none',
  color: theme.colors.error,
}))
