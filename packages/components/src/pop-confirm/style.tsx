import styled from '@emotion/styled'

import { lighten } from '@perfsee/dls'

export const Container = styled.div({
  padding: '12px 18px',
})

export const Header = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const Icon = styled.div(({ theme }) => ({
  marginRight: '8px',
  color: theme.colors.warning,
}))

export const Footer = styled.div({
  marginTop: '6px',
  display: 'flex',
  justifyContent: 'flex-end',
  alignItems: 'center',
})

const TinyButton = styled.button({
  display: 'block',
  cursor: 'pointer',
  fontSize: '12px',
  padding: '0px 6px',
  backgroundColor: 'transparent',
  borderRadius: '2px',
  transition: 'all 0.3s 0s ease',
})

export const Cancel = styled(TinyButton)(({ theme }) => ({
  border: `1px solid ${theme.text.colorSecondary}`,
  color: theme.text.colorSecondary,

  marginRight: '6px',

  ':hover': {
    borderColor: theme.colors.primary,
    color: theme.colors.primary,
  },
}))

export const Confirm = styled(TinyButton)(({ theme }) => ({
  color: theme.colors.white,
  border: `1px solid ${theme.colors.primary}`,
  backgroundColor: theme.colors.primary,

  ':hover': {
    borderColor: lighten(theme.colors.primary, 0.2),
    backgroundColor: lighten(theme.colors.primary, 0.2),
  },
}))
