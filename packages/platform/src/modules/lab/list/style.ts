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
import { DefaultButton, IDocumentCardStyles } from '@fluentui/react'

import { NeutralColors } from '@perfsee/dls'

export const cardStyle: IDocumentCardStyles = {
  root: {
    width: '100%',
    maxWidth: 'unset',
  },
}

export const InfoText = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.text.colorSecondary,
}))

export const InfoTitle = styled(InfoText)(({ theme }) => ({
  color: theme.text.color,
}))

export const DrawerTitle = styled.span(({ theme }) => ({
  color: theme.text.color,
  fontSize: '24px',
  fontWeight: 600,
}))

export const SnapshotListWrap = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
  gridColumnGap: '18px',
  gridRowGap: '24px',
  margin: '12px 0',
})

export const SnapshotCardHeader = styled.div({
  borderBottom: `1px solid ${NeutralColors.gray30}`,
  display: 'flex',
  padding: '0 12px',
  height: '48px',
  alignItems: 'center',
  '> span:first-of-type': {
    marginRight: '10px',
  },
})

export const CompareButtonInner = styled.span(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.link.color,

  '> span': {
    marginRight: '4px',
  },
}))

export const DrawerSetVersionButton = styled(DefaultButton)({
  float: 'right',
  marginTop: '16px',
})

export const DrawerArtifactSelectWarning = styled.span(({ theme }) => ({
  color: theme.colors.error,
}))
