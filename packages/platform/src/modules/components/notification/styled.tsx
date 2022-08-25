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

export const NoticeWrap = styled.div(({ theme }) => ({
  backgroundColor: theme.colors.white,
  boxShadow: '0 4px 12px rgb(0 0 0 / 15%)',
  marginBottom: '12px',
  padding: '16px',
  overflow: 'hidden',
  borderRadius: '2px',

  width: '340px',

  display: 'flex',
}))

export const IconWrap = styled.div<{ color: string }>(({ color }) => ({
  width: '24px',
  height: '24px',
  fontSize: '24px',
  marginRight: '16px',
  display: 'flex',

  color,
}))

export const NoticeTitle = styled.div({
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 600,
  marginBottom: '8px',
  userSelect: 'none',
})

export const ContentWrap = styled.div({
  flex: '1 1 0',
})

export const CloseButtonWrap = styled.div({
  width: '24px',
  height: '24px',
  fontSize: '14px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  top: '-12px',
  right: '-12px',
  cursor: 'pointer',
})
