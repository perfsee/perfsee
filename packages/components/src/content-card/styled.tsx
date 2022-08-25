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

export const CardWrap = styled.div(({ theme }) => ({
  backgroundColor: theme.colors.white,
  border: `1px solid ${theme.border.color}`,
  borderRadius: '2px',
  overflow: 'hidden',
}))

export const CardContentWrap = styled.div({
  padding: '24px 20px',
})

export const CardHeaderWrap = styled.div(({ theme }) => ({
  minHeight: '56px',
  display: 'flex',
  alignItems: 'center',
  padding: '12px 20px 0 20px',
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 600,
  color: theme.text.colorInWaringBlock,
}))
