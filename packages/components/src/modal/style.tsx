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

export const Container = styled.div({
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
})

export const Header = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px',
  flexShrink: 0,

  borderBottom: `1px solid ${theme.border.color}`,
}))

export const Content = styled.div({
  minHeight: '60px',
  flex: 1,
})

export const Footer = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  flexShrink: 0,

  padding: '12px',

  '> button + button': {
    marginLeft: '12px',
  },
})

export const Title = styled.div({
  display: 'flex',
  alignItems: 'center',

  span: {
    fontSize: '18px',
    fontWeight: 500,
  },
})

export const Icon = styled.div<{ color: string }>(({ color }) => ({
  display: 'flex',
  alignItems: 'center',
  color,
  marginRight: '8px',
}))

export const CloseIconWrap = styled.div({
  width: '18px',
  height: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
})
