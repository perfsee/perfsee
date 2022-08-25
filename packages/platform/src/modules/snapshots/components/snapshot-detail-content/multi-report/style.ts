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

export const CommonBoxContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
  marginTop: '6px',
})

export const HeaderTitle = styled.h3({
  display: 'flex',
  alignItems: 'center',
})

export const BorderContainer = styled.div(({ theme }) => {
  return {
    padding: '4px',
    border: `1px solid ${theme.border.color}`,
    borderRadius: '4px',
  }
})

export const DescText = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.text.colorSecondary,
}))
