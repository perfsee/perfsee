import styled from '@emotion/styled'

import BannerBgRight from '../../assets/banner-bg-right.png'
import BannerDecoration from '../../assets/banner-decoration.png'

export const Container = styled.div({
  width: '100%',
  height: '300px',
  position: 'relative',

  backgroundImage: `url(${BannerBgRight})`,
  backgroundSize: 'auto',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'top right',

  '@media(max-width: 480px)': {
    height: '450px',
  },
})

export const Decoration = styled.div({
  width: '500px',
  maxWidth: '100vw',
  height: '100%',
  zIndex: -1,
  position: 'absolute',
  backgroundImage: `url(${BannerDecoration})`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
})

export const ContentWrapper = styled.div({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',

  '@media(max-width: 480px)': {
    padding: '0 20px',
  },
})

export const Title = styled.h1({
  margin: '0 auto',
  textAlign: 'center',
  color: '#18191f',
})

export const Description = styled.p({
  margin: '16px 0 0',
  color: '#5d6494',
  textAlign: 'center',
  maxWidth: '800px',
  wordBreak: 'break-word',

  '@media(max-width: 960px)': {
    maxWidth: '450px',
  },

  '@media(max-width: 480px)': {
    maxWidth: '400px',
  },
})
