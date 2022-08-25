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

import { VscodeIcon as DefaultVscodeIcon } from '@perfsee/components'

export const PanelContainer = styled.div(({ theme }) => ({
  flexBasis: '50%',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  overflowX: 'hidden',
  minHeight: '870px',
  borderBottom: `1px solid ${theme.border.color}`,
  '&:not(:last-child)': {
    borderRight: `1px solid ${theme.border.color}`,
  },
}))

export const FlamechartHeader = styled.div(({ theme }) => ({
  borderBottom: `1px solid ${theme.border.color}`,
  lineHeight: '43px',
  padding: '0 12px',
  fontWeight: 600,
}))

export const VscodeIcon = styled(DefaultVscodeIcon)({
  width: '20px',
  height: '20px',
  margin: '0 8px 0 0',
})
