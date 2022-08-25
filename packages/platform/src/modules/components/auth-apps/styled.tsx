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

const AVATAR_COLORS = [
  SharedColors.redOrange10,
  SharedColors.orange10,
  SharedColors.greenCyan10,
  SharedColors.cyanBlue10,
]

const AVATAR_HEIGHT = 60
const getColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length]

export const AppList = styled.div({
  display: 'flex',
  flexWrap: 'wrap',

  '> div': {
    marginRight: '16px',
    marginBottom: '12px',
  },
})

export const AppWrap = styled.div<{ appId: number; selectable?: boolean }>(({ appId, selectable }) => ({
  height: AVATAR_HEIGHT,
  display: 'inline-flex',
  alignItems: 'center',
  userSelect: 'none',
  cursor: selectable ? 'pointer' : 'default',
  border: `1px solid ${getColor(appId)}`,
}))

export const Avatar = styled.div<{ appId: number }>(({ appId }) => ({
  width: AVATAR_HEIGHT + 'px',
  height: AVATAR_HEIGHT + 'px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '20px',
  backgroundColor: getColor(appId),
}))

export const Content = styled.div(() => ({
  height: '100%',
  padding: '4px 10px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-around',
}))

export const Title = styled.span({
  fontSize: '14px',
  fontWeight: 600,
})

export const PermissionSpan = styled.span(({ theme }) => ({
  color: theme.text.colorSecondary,
  fontSize: '12px',
}))

export const EditIcon = styled.span({
  marginLeft: '8px',
  cursor: 'pointer',
})

export const OperationWrap = styled.div({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  height: '100%',
})

export const OperationItem = styled.div<{ color: string }>(({ color }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flex: 1,
  width: AVATAR_HEIGHT / 3,
  color: color,
  fontSize: '12px',
  cursor: 'pointer',
}))

export const PermissionCheckWrap = styled.div({
  display: 'flex',
  alignItems: 'center',

  '> * + *': {
    marginLeft: '8px',
  },
})

export const AddAppWrap = styled.div({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: AVATAR_HEIGHT + 'px',
  height: AVATAR_HEIGHT + 'px',
  border: `1px solid ${SharedColors.gray10}`,
  color: SharedColors.gray10,
  fontSize: '24px',
  cursor: 'pointer',
})
