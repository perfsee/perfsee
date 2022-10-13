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
import { NeutralColors } from '@fluentui/theme'

export const Header = styled.div(({ theme }) => ({
  display: 'flex',
  borderTop: `4px solid ${theme.colors.primary}`,
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 12px 14px 24px',
  fontSize: '24px',
  fontWeight: 500,
  minWidth: '500px',
  gap: '16px',
  '> *:first-child': {
    flexGrow: 1,
  },
}))

export const Description = styled.div({
  padding: '0px 12px 0px 24px',
  lineHeight: 1.6,
})

export const IconWrapper = styled.span({
  width: '24px',
  height: '24px',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',

  ':hover': {
    backgroundColor: NeutralColors.gray30,
  },
})

export const TableWrap = styled.div({
  padding: '0 12px 24px',
})

export const OperationSpan = styled.span(({ theme }) => ({
  color: theme.link.color,
  cursor: 'pointer',

  ':hover': {
    color: theme.link.hoverColor,
  },
}))

export const DisabledOperationSpan = styled.span({
  color: NeutralColors.gray50,
  cursor: 'not-allowed',
})

export const EllipsisDiv = styled.div({
  maxWidth: '10rem',
  fontSize: '12px',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
})

export const PaginationWrap = styled.div({
  marginTop: '8px',
})
