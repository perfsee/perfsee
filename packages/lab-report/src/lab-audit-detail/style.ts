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
import { Stack } from '@fluentui/react'

import { darken } from '@perfsee/dls'

export const StyledBorderWrapper = styled.div(({ theme }) => ({
  width: '100%',
  wordBreak: 'break-word',
  whiteSpace: 'normal',
  '> div': {
    marginTop: '8px',
    padding: '8px',
    border: `1px solid ${darken(theme.border.color, 0.2)}`,
  },
}))

export const AuditDetailContainer = styled.div({
  width: '100%',

  '.lh-table': {
    width: '100%',
    wordBreak: 'break-word',

    '*': {
      textWrap: 'wrap',
    },
  },
})

export const AuditStackPacks = styled(Stack)({
  gap: 16,
  padding: '0 6px 8px',
  img: {
    minWidth: 'auto',
    maxWidth: 48,
  },
})
