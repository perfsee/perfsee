import styled from '@emotion/styled'

import { alpha } from '@perfsee/dls'

export const NavContainer = styled.div(({ theme }) => ({
  height: '100%',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  backgroundColor: 'white',
  boxShadow: theme.boxShadowBase,
}))

export const CollapseContainer = styled.div(({ theme }) => ({
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 8px',
  cursor: 'pointer',
  borderTop: `1px solid ${alpha(theme.border.color, 0.6)}`,
  userSelect: 'none',

  svg: {
    fontSize: '16px',
  },

  span: {
    marginLeft: '8px',
    fontSize: '12px',
  },

  ':hover': {
    backgroundColor: alpha(theme.border.color, 0.3),
  },
}))
