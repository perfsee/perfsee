import LogoImage from '@site/assets/logo.png'
import CloseIcon from '@site/assets/pages/close-icon.svg'
import Github from '@site/assets/pages/github.svg'
import MenuIcon from '@site/assets/pages/menu-icon.svg'
import React, { useCallback, useState } from 'react'

import { MediumDefaultButton, MediumPrimaryButton } from '../button'

import {
  ButtonsWrap,
  CloseIconWrapper,
  Container,
  FeatureLink,
  GithubLink,
  LeftContainer,
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
        <Logo href="/">
          <LogoWrapper>
            <img src={LogoImage} alt="logo" />
          </LogoWrapper>
          <Name>Perfsee</Name>
        </Logo>
        <Operations>
          <FeatureLink href="/feature/bundle">Bundle</FeatureLink>
          <FeatureLink href="/feature/lab">Lab</FeatureLink>
          <FeatureLink href="/feature/source">Source</FeatureLink>
          <GithubLink href="https://github.com/perfsee">
            <Github />
          </GithubLink>
          <ButtonsWrap>
            <MediumPrimaryButton href="https://perfsee.com">Try now</MediumPrimaryButton>
            <MediumDefaultButton href="/docs">Docs</MediumDefaultButton>
          </ButtonsWrap>
        </Operations>
      </Container>
      <MobileContainer>
        <LeftContainer>
          <MenuIconWrapper onClick={showSidebar}>
            <MenuIcon />
          </MenuIconWrapper>
          <Logo href="/">
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
            <MediumPrimaryButton href="https://perfsee.com">Try now</MediumPrimaryButton>
          </ButtonsWrap>
        </Operations>

        <SidebarCover visible={sidebarVisible} onClick={hideSidebar} />
        <SidebarContainer visible={sidebarVisible} onClick={stopPropagation}>
          <SidebarHeader>
            <Logo href="/">
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
              <a href="/feature/bundle">Bundle</a>
            </SidebarLi>
            <SidebarLi>
              <a href="/feature/lab">Lab</a>
            </SidebarLi>
            <SidebarLi>
              <a href="/feature/source">Source</a>
            </SidebarLi>

            <SidebarLi>
              <a href="https://github.com/perfsee">Github</a>
            </SidebarLi>
          </SidebarUl>
        </SidebarContainer>
      </MobileContainer>
    </>
  )
}
