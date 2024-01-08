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

export const StyledAuditItem = styled.div(({ theme }) => {
  return {
    padding: '12px 10px 8px',
    borderBottom: `1px solid ${theme.border.color}`,
  }
})
export const StyledItemContent = styled.div({
  marginLeft: '28px',
})

export const StyledAuditAdorn = styled.span(({ theme }) => ({
  display: 'inline-block',
  padding: '0 6px',

  border: `1px solid ${theme.text.colorSecondary}`,
  borderRadius: '12px',

  fontSize: '12px',
}))

export const StyledAuditDesc = styled.p(({ theme }) => ({
  marginTop: '4px',
  color: theme.text.colorSecondary,
}))
