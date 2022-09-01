import styled from '@emotion/styled'

export const LayoutWrapper = styled.div({
  width: '100%',
  maxWidth: '100%',
  position: 'relative',
})

const BaseContainer = styled.div({
  position: 'absolute',
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '8px 16px',
  zIndex: 1,
})

export const Container = styled(BaseContainer)({
  '@media(max-width: 960px)': {
    display: 'none',
  },
})

export const MobileContainer = styled(BaseContainer)({
  '@media(min-width: 960px)': {
    display: 'none',
  },
})

export const Link = styled.a({
  color: '#000',
  textDecoration: 'none',

  ':hover, :focus, :active': {
    color: '#000',
    textDecoration: 'none',
  },
})

export const Logo = styled(Link)({
  display: 'flex',
  alignItems: 'center',
  padding: '6px 0',
})

export const LogoWrapper = styled.div({
  width: '32px',
  height: '32px',
  marginRight: '0.5rem',

  img: {
    objectFit: 'contain',
  },
})

export const Name = styled.span({
  fontSize: '16px',
  fontWeight: 700,
})

export const Operations = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const GithubLink = styled(Link)({
  display: 'flex',
  alignItems: 'center',
  margin: '0 24px',

  width: '28px',
  height: '28px',
})

export const FeatureLink = styled(Link)({
  fontSize: '16px',
  fontWeight: 500,
  marginRight: '24px',
})

export const ButtonsWrap = styled.div({
  display: 'flex',
  alignItems: 'center',

  '> a + a': {
    marginLeft: '12px',
  },
})

export const LeftContainer = styled.div({
  display: 'flex',
  alignItems: 'center',
})

export const MenuIconWrapper = styled.div({
  display: 'flex',
  alignItems: 'center',
  marginRight: '12px',
  color: '#1c1e21',

  cursor: 'pointer',
  userSelect: 'none',
})

export const SidebarCover = styled.div<{ visible: boolean }>(({ visible }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  display: visible ? 'block' : 'none',
  width: '100vw',
  height: '100vh',
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  zIndex: 2,
}))

export const SidebarContainer = styled.div<{ visible: boolean }>(({ visible }) => ({
  position: 'fixed',
  width: '300px',
  height: '100vh',
  top: 0,
  left: visible ? '0' : '-300px',
  zIndex: 3,
  transition: 'left .2s ease',
  backgroundColor: '#fff',
}))

export const SidebarHeader = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  height: '60px',
  padding: '8px 16px',
  borderBottom: '1px solid #e1e1e1',
})

export const CloseIconWrapper = styled.div({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  width: '21px',
  height: '21px',
  color: '#8d949e',
  cursor: 'pointer',
})

export const SidebarUl = styled.ul({
  margin: '0',
  padding: '8px',
})

export const SidebarLi = styled.li({
  listStyle: 'none',
  padding: '6px 12px',

  '& + &': {
    marginTop: '4px',
  },

  '> a': {
    color: '#606770',
    fontSize: '16px',
    lineHeight: '20px',
    fontWeight: 500,
  },
})
