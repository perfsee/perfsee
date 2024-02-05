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

import { Tag as RawTag } from '@perfsee/components'

export enum PageStatus {
  Normal = 'success',
  Disabled = 'disabled',
  Error = 'error',
}

export const PageStatusDot = styled.div<{ status: PageStatus }>(({ theme, status }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '3px',
  backgroundColor: theme.colors[status],
  userSelect: 'none',
}))

export const PageCompititorIconWrapper = styled.div({
  position: 'absolute',
  top: '-8px',
  right: '-8px',
  fontSize: '20px',
})

export const ErrorMessage = styled.span(({ theme }) => ({
  color: theme.colors.error,
}))

export const PageHeaderWrap = styled.div({
  marginBottom: '12px',
})

export const PageHeaderInfo = styled.div({
  height: '24px',
  display: 'flex',
  alignItems: 'center',
  overflow: 'hidden',
  justifyContent: 'space-between',
  width: '100%',

  '> * + *': {
    marginLeft: '8px',
  },
})

export const PageHeaderLink = styled.div(({ theme }) => ({
  fontSize: '12px',
  lineHeight: '18px',
  color: theme.text.colorSecondary,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))

export const Tag = styled(RawTag)({
  flexShrink: 0,
  fontSize: '12px',
})
