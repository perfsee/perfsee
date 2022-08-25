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
import { Pivot, SharedColors } from '@fluentui/react'

export const AuditTitle = styled.h3({
  paddingTop: '16px',
  marginLeft: '20px',
})

export const StyledPivot = styled(Pivot)(({ theme }) => ({
  position: 'relative',

  ':after': {
    content: "''",
    width: '100%',
    height: '1px',
    position: 'absolute',
    backgroundColor: theme.border.color,
    bottom: 0,
    zIndex: 1,
  },
  button: {
    border: `1px solid ${theme.border.color}`,
    borderTopLeftRadius: theme.border.radius,
    borderTopRightRadius: theme.border.radius,
  },
  '.is-selected': {
    color: SharedColors.cyanBlue10,
    zIndex: 2,
    borderBottomColor: 'white',
    '::before': {
      display: 'none',
    },
  },
}))
