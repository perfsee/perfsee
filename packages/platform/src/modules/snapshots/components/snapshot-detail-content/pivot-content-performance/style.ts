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
import {
  CommandButton,
  CommunicationColors,
  DefaultButton,
  NeutralColors,
  Pivot,
  SharedColors,
  Stack,
} from '@fluentui/react'

export const AuditTitle = styled.h3({
  padding: '16px 0 0 16px',
  display: 'flex',
  alignItems: 'self-start',

  '& > button': {
    height: '26px',
    color: CommunicationColors.shade10,
    marginLeft: 12,
  },

  '&:not(:has(+div))': {
    paddingBottom: 16,
    borderBottom: `1px solid ${NeutralColors.gray40}`,
  },
})

export const StyledPivot = styled(Pivot)(({ theme }) => ({
  position: 'relative',
  height: '44px',

  ':after': {
    content: "''",
    width: '100%',
    height: '1px',
    position: 'absolute',
    backgroundColor: theme.border.color,
    bottom: 0,
    zIndex: 1,
  },
  button: {
    border: `1px solid ${theme.border.color}`,
    borderTopLeftRadius: theme.border.radius,
    borderTopRightRadius: theme.border.radius,
  },
  '.is-selected': {
    color: SharedColors.cyanBlue10,
    zIndex: 2,
    borderBottomColor: 'white',
    '::before': {
      display: 'none',
    },
  },
}))

export const RelevantChoiceContainer = styled(Stack)({
  height: 56,
  position: 'absolute',
  right: 12,

  '& > label': {
    color: NeutralColors.gray120,
    marginRight: 12,
  },
})

export const RelevantChoiceButton = styled(CommandButton)({
  height: 24,
  '&.selected': {
    backgroundColor: CommunicationColors.tint10,
    color: NeutralColors.white,
  },
})

export const AuditJumpButton = styled(DefaultButton)({
  height: 20,
  fontWeight: 300,
  padding: 6,
  borderRadius: 12,
  whiteSpace: 'pre',

  span: {
    fontWeight: 400,
    fontSize: 12,
    color: CommunicationColors.tint10,
  },
})

export const WarnLabel = styled.span({
  color: SharedColors.orange20,
})

export const ErrorLabel = styled.span({
  color: SharedColors.red10,
})
