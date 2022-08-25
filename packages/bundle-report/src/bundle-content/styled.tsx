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
import { SharedColors } from '@fluentui/theme'

export const Container = styled.div({
  display: 'flex',
  flexDirection: 'column',
})

export const Header = styled.div({
  flexShrink: 0,
  flexBasis: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  margin: '8px 0',

  a: {
    height: '16px',
    lineHeight: 1,
  },

  'span + span': {
    marginLeft: '8px',
  },
})

export const ChartWrapper = styled.div({
  flexGrow: 1,
  // pageHeight - top nav - header - footer
  height: 'calc(100vh - 60px - 50px - 58px)',
})

export const ShortcutTips = styled.div({
  fontSize: '12px',
  color: SharedColors.gray30,
})
