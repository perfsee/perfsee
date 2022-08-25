import styled from '@emotion/styled'
import { FC, memo } from 'react'
import { Link } from 'react-router-dom'

import { resetLink } from '@perfsee/dls'
import { staticPath } from '@perfsee/shared/routes'

export const StyledFooter = styled.footer<{ narrow?: boolean }>(({ theme, narrow = false }) => ({
  display: 'flex',
  marginLeft: narrow ? 0 : theme.layout.mainPadding,
  padding: `20px ${narrow ? 20 : 0}px`,
}))

export const FooterLink = styled(Link)(({ theme }) => ({
  color: theme.text.colorSecondary,
  fontSize: '12px',
  marginRight: '10px',
  ...resetLink(theme.text.colorSecondary),
  ':hover': {
    textDecoration: 'none',
  },
  ':not(:last-of-type):after': {
    content: "'·'",
    paddingLeft: '8px',
  },
}))

type Props = {
  narrow?: boolean
  isAdmin?: boolean
}

export const Footer: FC<Props> = memo(({ narrow, isAdmin }) => {
  return (
    <StyledFooter narrow={narrow}>
      <FooterLink to={staticPath.status}>Status</FooterLink>
      <FooterLink to={staticPath.license}>License</FooterLink>
      {isAdmin && <FooterLink to={staticPath.applications}>Applications</FooterLink>}
    </StyledFooter>
  )
})
