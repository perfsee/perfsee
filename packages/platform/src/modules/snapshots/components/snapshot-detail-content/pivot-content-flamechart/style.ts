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
import { NeutralColors, Stack } from '@fluentui/react'

export const FlamechartContainer = styled.div(({ theme }) => ({
  width: '100%',
  height: 'calc(100vh - 350px)',
  minHeight: '500px',
  background: theme.colors.white,
}))

export const DetailContentContainer = styled(Stack)({
  overflow: 'hidden',
  lineBreak: 'anywhere',
})

export const DetailTitle = styled.span({
  fontWeight: 500,
  background: NeutralColors.gray10,
  margin: '0 -24px',
  padding: '6px 24px',
})

export const DetailKey = styled(Stack)({
  flexShrink: 0,
  width: 150,
})

export const SlowedDownByItemContainer = styled(Stack)({
  overflowX: 'hidden',
  lineBreak: 'anywhere',
  '&:not(:last-of-type)': {
    borderBottom: `1px solid ${NeutralColors.gray40}`,
    paddingBottom: 12,
  },
})
