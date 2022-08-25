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

export const CircleWrapper = styled.div({
  width: '180px',
  height: '180px',
  position: 'relative',
  display: 'block',

  circle: {
    cursor: 'pointer',
    transition: `stroke-width 0.3s ease-in-out`,
    ':hover': {
      strokeWidth: 3,
    },
    transformOrigin: 'center',
  },
})

export const TableWrapper = styled.table(({ theme }) => ({
  tr: {
    display: 'block',
    cursor: 'pointer',
    padding: '0 4px',
    borderRadius: '4px',
    '&.focused, &:hover': {
      backgroundColor: theme.colors.primaryBackground,
    },
  },
  td: {
    display: 'inline-block',

    '+td': {
      marginLeft: '8px',
    },
  },

  '.name': {
    minWidth: '64px',
  },

  '.size': {
    minWidth: '80px',
    textAlign: 'right',
  },

  '.diff': {
    marginLeft: '24px',
  },
}))

export const ColorfulDot = styled.span(({ color }: { color: string }) => ({
  display: 'inline-block',
  width: '10px',
  height: '10px',
  borderRadius: '50%',
  backgroundColor: color,
}))
