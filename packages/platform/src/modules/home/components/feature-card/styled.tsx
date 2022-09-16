import styled from '@emotion/styled'

export const Container = styled.div<{ reverse: boolean }>(({ reverse }) => ({
  margin: '60px 0 120px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexDirection: reverse ? 'row-reverse' : 'row',

  '@media(max-width: 960px)': {
    flexDirection: 'column',

    '> div + div': {
      marginTop: '30px',
      marginBottom: '30px',
    },
  },
}))

export const ContentWrapper = styled.div({
  margin: '0 30px',
})

export const Title = styled.h2({
  margin: '0',
  color: '#18191f',
  marginBottom: '12px',
})

export const Description = styled.p({
  margin: '0',
  maxWidth: '400px',
  wordBreak: 'break-word',
  color: '#5d6494',
})

export const ImageWrapper = styled.div({
  margin: '0 30px',
  maxWidth: '500px',
  minWidth: '300px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',

  backgroundColor: 'transparent',
  boxShadow: '0 0 0 rgb(54 45 89 / 15%), 0 0 100px rgb(54 45 89 / 20%)',

  img: {
    maxWidth: '100%',
    objectFit: 'contain',
  },
})
