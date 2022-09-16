import { Link } from 'react-router-dom'

import { ForeignLink } from '@perfsee/components'
import { staticPath } from '@perfsee/shared/routes'

import BannerLeftImage from '../../assets/banner-bg-left.png'
import BannerRightImage from '../../assets/banner-bg-right.png'
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
          <Link to={staticPath.projects}>
            <PrimaryButton>Try now</PrimaryButton>
          </Link>
          <ForeignLink href="/docs">
            <DefaultButton>Docs</DefaultButton>
          </ForeignLink>
        </ButtonsWrap>
      </ContentWrap>
    </BannerContainer>
  )
}
