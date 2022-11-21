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

export const FormatLabelWrapper = styled.h3({
  display: 'inline-block',
})

export const TooltipItemColor = styled.div<{ color: string }>(({ color }) => ({
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: color,
  marginTop: 4,
}))

export const UsageTableWrapper = styled.div({
  display: 'flex',
  margin: '12px 0 24px',
})

export const UsageBlock = styled.div({
  display: 'flex',
  alignItems: 'center',
  width: '220px',
  padding: '8px 12px',
  borderRadius: '2px',
  boxShadow: `0px 0px 2px 2px ${NeutralColors.gray20}`,
  marginRight: '20px',
})

export const UsageBlockIcon = styled.div(({ theme }) => ({
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: theme.colors.primary,
  borderRadius: '4px',

  color: '#fff',
  fontSize: '20px',
}))

export const UsageBlockInfo = styled.div({
  flex: 1,
  marginLeft: '8px',
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
})

export const UsageBlockTitle = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  flexShrink: 0,

  span: {
    color: theme.text.colorSecondary,
    fontSize: '12px',
  },
}))

export const ProgressWrapper = styled.div({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
})

export const ProgressValue = styled.span(({ theme }) => ({
  transformOrigin: 'top left',
  marginTop: '4px',
  color: theme.text.colorSecondary,
}))

export const UsagePackWrapper = styled.div({
  width: '320px',
  margin: '12px 0 24px',
  boxShadow: `0px 0px 2px 2px ${NeutralColors.gray20}`,
  borderRadius: '2px',
})

export const UsagePackHeader = styled.div(({ theme }) => ({
  padding: '12px 16px',
  borderBottom: `1px solid ${theme.border.color}`,
}))

export const UsagePackContent = styled.div({
  padding: '12px 16px',

  '> div + div': {
    marginTop: '8px',
  },
})

export const UsagePackIcon = styled.span(({ theme }) => ({
  color: theme.colors.primary,
}))
