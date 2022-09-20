import styled from '@emotion/styled'

import BannerRightImage from '../../assets/banner-background.png'

export const BannerContainer = styled.div({
  width: '100%',
  height: '760px',
  position: 'relative',
  padding: '0 120px',

  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-around',

  backgroundImage: `url(${BannerRightImage})`,
  backgroundSize: 'contain',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'center',

  '@media(max-width: 1200px)': {
    padding: '0 60px',
  },

  '@media(max-width: 960px)': {
    overflow: 'hidden',
    padding: '0 30px',
  },

  '@media(max-width: 480px)': {
    height: '550px',
  },
})

export const BannerBackground = styled.div({
  zIndex: -1,
  position: 'absolute',
  top: 0,

  img: {
    width: '100%',
  },

  '@media(max-width: 960px)': {
    // display: 'none',
  },
})

export const BannerLeftBgWrap = styled(BannerBackground)({
  left: 0,
})

export const BannerRightBgWrap = styled(BannerBackground)({
  right: 0,
})

export const ContentWrap = styled.div({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  paddingTop: '210px',
})

export const Slogan = styled.span({
  maxWidth: '860px',
  display: 'block',
  wordWrap: 'break-word',
  color: 'rgba(8, 19, 33, 0.3)',
  textAlign: 'center',

  p: {
    fontSize: '54px',
    lineHeight: '62px',
    margin: '0',
    color: '#393E43',
    marginBottom: '24px',
  },

  b: {
    fontSize: '72px',
    fontWeight: 700,
    lineHeight: '82px',
    color: '#081321',
    textTransform: 'uppercase',
  },

  '@media(max-width: 1200px)': {
    fontSize: '48px',
    lineHeight: '64px',
  },

  '@media(max-width: 480px)': {
    p: {
      fontSize: '36px',
      lineHeight: '48px',
      marginBottom: '0',
    },

    b: {
      fontSize: '36px',
      lineHeight: '48px',
    },
  },
})

export const ButtonsWrap = styled.div({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: '42px',

  'a + a': {
    marginLeft: '24px',
  },
})
