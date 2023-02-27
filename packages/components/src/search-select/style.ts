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
import { NeutralColors } from '@fluentui/theme'

export const OptionWrapper = styled.div({
  cursor: 'pointer',
  width: '100%',
  '&:hover': {
    backgroundColor: NeutralColors.gray20,
  },
})

export const TargetWrapper = styled.div<{ error: boolean }>(({ theme, error }) => ({
  width: '100%',
  maxWidth: '100%',
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  border: `1px solid ${error ? theme.colors.error : NeutralColors.gray120}`,
  borderRadius: '2px',
}))

export const ErrorMessage = styled.p(({ theme }) => ({
  color: theme.colors.error,
  fontSize: '12px',
}))

export const Tag = styled.span({
  borderRadius: '4px',
  padding: '1px 4px',

  backgroundColor: NeutralColors.gray20,
  whiteSpace: 'nowrap',

  '> span': {
    fontSize: '12px',
    paddingLeft: '4px',
  },

  ':first-of-type': {
    marginLeft: '4px',
  },
})
