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

import { DeleteOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'

export const Container = styled.div({
  padding: '24px 80px',
})

export const ListWrap = styled.div({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
  gridColumnGap: '18px',
  gridRowGap: '24px',
  margin: '24px 0',
})

export const TokenItem = styled.div(({ theme }) => ({
  width: '100%',
  border: `1px solid ${theme.border.color}`,
  padding: '12px 16px',
  display: 'flex',
  flexDirection: 'column',
  color: theme.text.colorSecondary,
}))

export const TokenHeader = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
})

export const TokenName = styled.b(({ theme }) => ({
  fontSize: '18px',
  color: theme.text.color,
}))

export const DeleteIcon = styled(DeleteOutlined)(({ theme }) => ({
  color: theme.colors.error,
  cursor: 'pointer',
}))
