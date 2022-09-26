import { useCallback, useState } from 'react'

import { staticPath } from '@perfsee/shared/routes'

import CloseIcon from '../../assets/close-icon.svg'
import Github from '../../assets/github.svg'
import LogoImage from '../../assets/logo.png'
import MenuIcon from '../../assets/menu-icon.svg'
import { MediumDefaultButton, MediumPrimaryButton } from '../button'

import {
  ButtonsWrap,
  CloseIconWrapper,
  Container,
  FeatureLink,
  GithubLink,
  LeftContainer,
  Link,
  ForeignLink,
  Logo,
  LogoWrapper,
  MenuIconWrapper,
  MobileContainer,
  Name,
  Operations,
  SidebarContainer,
  SidebarCover,
  SidebarHeader,
  SidebarLi,
  SidebarUl,
} from './styled'

export const Header = () => {
  const [sidebarVisible, setSidebarVisible] = useState(false)

  const showSidebar = useCallback(() => {
    setSidebarVisible(true)
  }, [setSidebarVisible])

  const hideSidebar = useCallback(() => {
    setSidebarVisible(false)
  }, [setSidebarVisible])

  const stopPropagation = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
  }, [])

  return (
    <>
      <Container>
        <Logo to={staticPath.home}>
          <LogoWrapper>
            <img src={LogoImage} alt="logo" />
          </LogoWrapper>
          <Name>Perfsee</Name>
        </Logo>
        <Operations>
          <FeatureLink to={staticPath.features.bundle}>Bundle</FeatureLink>
          <FeatureLink to={staticPath.features.lab}>Lab</FeatureLink>
          <FeatureLink to={staticPath.features.source}>Source</FeatureLink>
          <GithubLink href="https://github.com/perfsee">
            <Github />
          </GithubLink>
          <ButtonsWrap>
            <Link to={staticPath.projects}>
              <MediumPrimaryButton>Try now</MediumPrimaryButton>
            </Link>
            <ForeignLink href={staticPath.docs.home}>
              <MediumDefaultButton>Docs</MediumDefaultButton>
            </ForeignLink>
          </ButtonsWrap>
        </Operations>
      </Container>
      <MobileContainer>
        <LeftContainer>
          <MenuIconWrapper onClick={showSidebar}>
            <MenuIcon />
          </MenuIconWrapper>
          <Logo to={staticPath.home}>
            <LogoWrapper>
              <img src={LogoImage} alt="logo" />
            </LogoWrapper>
            <Name>Perfsee</Name>
          </Logo>
        </LeftContainer>
        <Operations>
          <GithubLink href="https://github.com/perfsee">
            <Github />
          </GithubLink>
          <ButtonsWrap>
            <Link to={staticPath.projects}>
              <MediumPrimaryButton>Try now</MediumPrimaryButton>
            </Link>
          </ButtonsWrap>
        </Operations>

        <SidebarCover visible={sidebarVisible} onClick={hideSidebar} />
        <SidebarContainer visible={sidebarVisible} onClick={stopPropagation}>
          <SidebarHeader>
            <Logo to={staticPath.home}>
              <LogoWrapper>
                <img src={LogoImage} alt="logo" />
              </LogoWrapper>
              <Name>Perfsee</Name>
            </Logo>
            <CloseIconWrapper onClick={hideSidebar}>
              <CloseIcon />
            </CloseIconWrapper>
          </SidebarHeader>
          <SidebarUl>
            <SidebarLi>
              <Link to={staticPath.features.bundle}>Bundle</Link>
            </SidebarLi>
            <SidebarLi>
              <Link to={staticPath.features.lab}>Lab</Link>
            </SidebarLi>
            <SidebarLi>
              <Link to={staticPath.features.source}>Source</Link>
            </SidebarLi>

            <SidebarLi>
              <ForeignLink href="https://github.com/perfsee">Github</ForeignLink>
            </SidebarLi>
          </SidebarUl>
        </SidebarContainer>
      </MobileContainer>
    </>
  )
}
