import styled from '@emotion/styled'
import { memo } from 'react'
import { Link } from 'react-router-dom'

import { ForeignLink } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

export const StyledFooter = styled.footer({
  padding: `20px 20px 32px`,
})

export const Container = styled.div({
  maxWidth: '1100px',
  padding: '0 20px',
  margin: '0px auto',
})

export const Line = styled.div(({ theme }) => ({
  margin: '0px auto 18px',
  width: '50%',
  height: '1px',
  background: theme.border.color,
}))

const LinkStyle = {
  fontSize: '13px',
  margin: '0 16px',
}

export const FooterLink = styled(Link)(LinkStyle)

export const FooterForeignLink = styled(ForeignLink)(LinkStyle)

export const Links = styled.div({
  textAlign: 'center',
  marginBottom: '16px',
  lineHeight: '2',
})

const Copyright = styled.div({
  textAlign: 'center',
  fontSize: '13px',
  opacity: 0.8,
})

export const Footer = memo(({ isAdmin }: { isAdmin?: boolean }) => {
  return (
    <StyledFooter>
      <Container>
        <Line />
        <Links>
          <FooterLink to={staticPath.extensions.home}>Extensions</FooterLink>
          <wbr />
          <FooterForeignLink href={staticPath.docs.home}>Documents</FooterForeignLink>
          <wbr />
          <FooterForeignLink href={staticPath.docs.api}>API</FooterForeignLink>
          <wbr />
          {isAdmin && <FooterLink to={staticPath.admin.home}>Admin</FooterLink>}
          <wbr />
          <FooterLink to={staticPath.status}>Status</FooterLink>
          <wbr />
          <FooterLink to={staticPath.license}>License</FooterLink>
          <wbr />
          <FooterForeignLink href="https://github.com/perfsee">Github</FooterForeignLink>
          <wbr />
        </Links>
      </Container>
      <Copyright>Copyright © {new Date().getFullYear()} Perfsee</Copyright>
    </StyledFooter>
  )
})
