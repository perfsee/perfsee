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

import { CheckCircleFilled, CloseCircleFilled, ExclamationCircleFilled } from '@ant-design/icons'
import styled from '@emotion/styled'
import { NeutralColors, SharedColors } from '@fluentui/react'

export const SecondPivotStyle = {
  root: { borderRadius: '4px' },
  link: {
    backgroundColor: NeutralColors.gray10,
    color: NeutralColors.gray130,
    border: `4px solid ${NeutralColors.gray10}`,
    '&:hover,&:active': {
      backgroundColor: `${NeutralColors.white} !important`,
      color: NeutralColors.gray130,
    },
  },
  linkIsSelected: {
    backgroundColor: `${NeutralColors.white} !important`,
    color: `${SharedColors.cyanBlue10} !important`,
  },
}

export const ReportIconWrap = styled.div(({ theme }) => ({
  fontSize: '60px',
  lineHeight: 1,
  color: theme.text.colorSecondary,
}))

export const CreatedAtWrap = styled.span(({ theme }) => ({
  color: theme.text.color,
}))

export const IssueWrap = styled.div({
  padding: '16px 24px 24px',
})

export const AuditsDetailIconWrap = styled.div({
  fontSize: '14px',
  marginRight: '8px',
})

export const AuditItemDesc = styled.div(({ theme }) => ({
  color: theme.text.colorSecondary,
  borderTop: `1px solid ${theme.border.color}`,
  paddingTop: '8px',
  paddingLeft: '4px',
}))

export const ErrorAuditDesc = styled.span({
  color: SharedColors.red10,
  paddingLeft: '8px',
})

export const ErrorIcon = styled(CloseCircleFilled)({
  color: SharedColors.red10,
})

export const WarningIcon = styled(ExclamationCircleFilled)({
  color: SharedColors.orange10,
})

export const GoodIcon = styled(CheckCircleFilled)({
  color: SharedColors.green10,
})

export const AuditItem = styled.div({
  borderBottom: `1px solid ${NeutralColors.gray30}`,
})
