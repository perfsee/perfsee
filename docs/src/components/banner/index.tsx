import BannerLeftImage from '@site/assets/pages/banner-bg-left.png'
import BannerRightImage from '@site/assets/pages/banner-bg-right.png'
import React from 'react'

import { PrimaryButton, DefaultButton } from '../button'

import { BannerContainer, BannerLeftBgWrap, BannerRightBgWrap, ButtonsWrap, ContentWrap, Slogan } from './styled'

export const HomeBanner = () => {
  return (
    <BannerContainer>
      <BannerLeftBgWrap>
        <img src={BannerLeftImage} />
      </BannerLeftBgWrap>
      <BannerRightBgWrap>
        <img src={BannerRightImage} />
      </BannerRightBgWrap>
      <ContentWrap>
        <Slogan>
          <p>Care more about your</p>
          <b>website performance</b>
        </Slogan>
        <ButtonsWrap>
          <PrimaryButton href="https://perfsee.com">Try now</PrimaryButton>
          <DefaultButton href="/docs">Docs</DefaultButton>
        </ButtonsWrap>
      </ContentWrap>
    </BannerContainer>
  )
}
