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
import { Link } from 'react-router-dom'

import { ForeignLink } from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'
import { SnapshotStatus } from '@perfsee/schema'

import { getStatusColor } from '../shared'

export const SnapshotTitle = styled.div(({ theme }) => ({
  fontSize: '18px',
  color: theme.text.color,
  fontWeight: 600,
  maxWidth: '100%',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}))

export const ListTimeLabel = styled.p(({ theme }) => ({
  color: theme.text.colorSecondary,
}))

export const StatusText = styled(ForeignLink)<{ status: SnapshotStatus; size?: 'normal' | 'small' }>(
  ({ status, theme, size = 'normal' }) => {
    const color = getStatusColor(status, theme)

    return {
      ':-webkit-any-link': {
        color,
      },
      color,
      fontSize: size === 'normal' ? '14px' : '12px',
      fontWeight: size === 'normal' ? 'bold' : 'normal',
      textTransform: 'capitalize',
      ':hover': {
        textDecoration: 'none',
        color,
      },
    }
  },
)

export const ListCell = styled.div(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '14px',
  alignItems: 'center',
  width: '100%',
  padding: '10px 10px 10px 20px',
  borderBottom: `solid 1px ${theme.border.color}`,
  a: {
    fontWeight: 'bolder',
  },
}))

export const DisabledText = styled.span(() => ({
  cursor: 'not-allowed',
}))

export const NoticeLabel = styled.b(() => ({
  color: SharedColors.blue10,
  padding: '0 4px',
}))

export const LinkButton = styled(Link)({
  border: `1px solid ${SharedColors.blue10}`,
  padding: '6px',
  borderRadius: '4px',
})

export const TableContainer = styled.div({
  '.checkboxCell > div[role=checkbox]': {
    height: '100%',
  },
})
