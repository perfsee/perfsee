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
import { DefaultButton, Stack } from '@fluentui/react'

import { getScoreColor } from '@perfsee/components'

export const HeaderContainer = styled.div({
  display: 'flex',
  flexDirection: 'column',
})

export const ScoreBadge = styled.span<{ score: number }>(({ score }) => {
  const color = getScoreColor(score)
  return {
    marginLeft: '5px',
    padding: '4px',
    width: '30px',
    fontWeight: 'bold',
    color: color,
  }
})

export const SnapshotKey = styled.span({
  fontSize: '24px',
  marginRight: '16px',
  fontWeight: 'normal',
})

export const SnapshotHeaderTime = styled.span(({ theme }) => ({
  fontSize: '14px',
  color: theme.text.colorSecondary,
  fontWeight: 'normal',
  '> span': {
    paddingRight: '4px',
  },
}))

export const OperationButton = styled(DefaultButton)(({ theme }) => ({
  borderColor: theme.text.colorSecondary,
  whiteSpace: 'nowrap',
  '> span > a': {
    color: theme.text.color,
    textDecoration: 'none',
  },
}))

export const LighthouseBrand = styled(Stack)(({ theme }) => ({
  color: theme.text.colorSecondary,
  paddingTop: '12px',
}))
