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

export const CardWrapper = styled.div<{ hideBorder: boolean }>(({ theme, hideBorder }) => {
  if (hideBorder) {
    return {}
  }
  return {
    boxShadow: theme.boxShadowBase,
    padding: '18px 28px',
  }
})

export const ChartHeaderTitle = styled.h3({
  marginBottom: '4px',
  display: 'flex',
  alignItems: 'center',
})

export const ChartHeaderDesc = styled.p(({ theme }) => ({
  fontSize: '14px',
  fontWeight: 'normal',
  marginBottom: '20px',
  color: theme.text.colorSecondary,
}))
