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

export const cardStyle = {
  root: {
    width: '100%',
    maxWidth: 'unset',
  },
}
export const PackageListWrap = styled.div({
  display: 'flex',
  flexDirection: 'column',
  margin: '12px 0',
  '> div:not(:first-of-type)': {
    marginTop: '48px',
  },
})

export const PackageTable = styled.div({
  borderTop: `1px solid ${NeutralColors.gray30}`,
  display: 'flex',
  flexDirection: 'column',
})

export const PackageCardHeader = styled.div({
  borderBottom: `1px solid ${NeutralColors.gray30}`,
  display: 'flex',
  padding: '0 12px',
  height: '48px',
  alignItems: 'center',
  '> span:first-of-type': {
    marginRight: '10px',
  },
  justifyContent: 'space-between',
})

export const PackageTitle = styled.div(({ theme }) => ({
  fontSize: '18px',
  color: theme.text.color,
  fontWeight: 600,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))

export const InfoText = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.text.colorSecondary,
}))

export const InfoTitle = styled(InfoText)(({ theme }) => ({
  color: theme.text.color,
}))

export const InformationContainer = styled.div({
  overflow: 'hidden',
})
