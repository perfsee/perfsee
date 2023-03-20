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
import { Stack, Image, NeutralColors } from '@fluentui/react'

export const Cell = styled(Stack)(({ theme }) => ({
  cursor: 'pointer',
  padding: '12px 8px',
  borderRadius: '2px',
  margin: '4px 0',
  willChange: 'box-shadow',
  transition: 'box-shadow 0.1s ease-in-out',
  ':hover': {
    boxShadow: theme.boxShadowBase,
  },
}))

export const TextImage = styled(Image)(({ theme, title }) => ({
  position: 'relative',
  borderRadius: '50%',
  ':after': {
    content: `"${title!.substring(0, 1).toUpperCase()}"`,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '20px',
    color: theme.colors.white,
  },
  backgroundColor: theme.colors.primary,
}))

export const PackageCardHeader = styled.div({
  borderBottom: `1px solid ${NeutralColors.gray30}`,
  display: 'flex',
  padding: '0 12px',
  height: '48px',
  alignItems: 'center',
  '> span:first-of-type': {
    marginRight: '10px',
  },
})

export const PackageTitle = styled.div(({ theme }) => ({
  fontSize: '18px',
  color: theme.text.color,
  fontWeight: 600,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))

export const PackageListWrap = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gridColumnGap: '18px',
  gridRowGap: '24px',
  margin: '12px 0',
})

export const PackageInfoText = styled.span(({ theme }) => ({
  fontSize: '12px',
  color: theme.text.colorSecondary,
}))

export const PackageInfoTitle = styled(PackageInfoText)(({ theme }) => ({
  color: theme.text.color,
}))
