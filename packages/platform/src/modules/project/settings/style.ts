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

import { NeutralColors, SharedColors } from '@perfsee/dls'

export const StyledDesc = styled.span<{ size?: string }>(({ theme, size }) => ({
  fontSize: size ?? '14px',
  color: theme.text.colorSecondary,
  ':not(:last-of-type):after': {
    content: "'・'",
    margin: '0 0px',
  },
}))

export const EllipsisText = styled.div({
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  flex: 1,
})

export const ButtonWrapper = styled.div(({ theme }) => ({
  display: 'flex',
  borderTop: `1px solid ${theme.border.color}`,
  padding: '4px 0',
}))

export const OperationItemWrap = styled.div<{ color?: string; grow?: number }>(({ color, theme, grow = 1 }) => ({
  flex: 1,
  flexGrow: grow,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '4px 8px',
  cursor: 'pointer',
  color,

  '> div': {
    width: '18px',
    height: '18px',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '8px',
  },

  '> span': {
    fontSize: '14px',
  },

  ':nth-of-type(n+2)': {
    borderLeft: `1px solid ${theme.border.color}`,
  },
}))

export const WarningText = styled.b(({ theme }) => {
  return {
    color: theme.colors.error,
    wordBreak: 'break-word',
  }
})

export const NormalToken = { padding: '8px 0 4px 0', childrenGap: 8 }

export const TextFieldStyles = { root: { flex: 1 } }

export const TipTextBold = styled.span<{ color?: string }>(({ color }) => ({
  marginLeft: '8px',
  fontWeight: 'bold',
  color: color ?? SharedColors.green10,
}))

export const OperationButtonWrap = styled.div({
  width: '28px',
  height: '28px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontSize: '24px',
  borderRadius: '2px',
  cursor: 'pointer',

  ':hover': {
    backgroundColor: NeutralColors.gray20,
  },
})

export const PagePropertyWrap = styled.div({
  display: 'flex',
  alignItems: 'center',
  maxWidth: '200px',
  marginBottom: '4px',
})

export const PagePropertyIcon = styled.span(({ theme }) => ({
  color: theme.colors.primary,
  marginRight: '8px',
}))

export const PagePropertyValue = styled.span({})

export const PropertyId = styled.span({
  color: NeutralColors.gray80,
  fontSize: 12,
  display: 'none',
})

export const PropertyCard = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;

  &:hover ${PropertyId} {
    display: block;
  }
`

export const PropertyCardTop = styled.div({
  padding: '16px',
  display: 'flex',
  flex: 1,
})

export const PropertyName = styled.span({
  flex: 1,
  fontSize: '18px',
  lineHeight: '24px',
  fontWeight: 600,
  marginRight: '4px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const PropertyIcon = styled.div<{ disable: boolean; error?: boolean }>(({ theme, disable, error }) => ({
  flexShrink: 0,
  width: '42px',
  height: '42px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '50%',
  backgroundColor: disable ? theme.colors.disabled : error ? theme.colors.error : theme.colors.primary,

  fontSize: '21px',
  color: theme.colors.white,

  userSelect: 'none',
}))

export const PropertyInfos = styled.div({
  flex: 1,
  marginLeft: '16px',
  overflow: 'hidden',
})

export const PropertyDescription = styled.div({
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})
