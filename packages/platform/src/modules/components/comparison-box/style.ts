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

import { InboxOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { ZIndexes } from '@fluentui/react'

export const Container = styled.div({
  position: 'fixed',
  bottom: '20px',
  right: '30px',
  zIndex: ZIndexes.Layer + 1,
})

export const IconBox = styled.div(({ theme }) => ({
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '50px',
  height: '50px',
  cursor: 'pointer',
  color: theme.colors.white,
  backgroundColor: theme.colors.running,
  fontSize: '30px',
  padding: '0 10px',
}))

export const StyledInboxOutlined = styled(InboxOutlined)({
  marginTop: '2px',
})

export const SelectMoreTip = styled.p<{ isError?: boolean }>(({ theme, isError = true }) => ({
  fontSize: '12px',
  color: isError ? theme.colors.error : theme.text.color,
}))

export const StartCompareButtonInner = styled.span({
  fontSize: '12px',
  display: 'inline-flex',
  alignItems: 'center',

  'span + span': {
    marginLeft: '4px',
  },
})

export const CalloutHeader = styled.h3(({ theme }) => ({
  color: theme.link.color,
}))
