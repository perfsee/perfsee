import styled from '@emotion/styled'

export const Container = styled.div({
  marginTop: '60px',
  textAlign: 'center',
})

export const FeatureItemWrap = styled.div({
  display: 'flex',
  width: '100%',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '60px 0 120px',
  padding: '0 24px',

  '> div + div': {
    marginLeft: '120px',
  },

  '@media(max-width: 960px)': {
    flexDirection: 'column',

    '> div + div': {
      margin: '30px 0',
    },

    ':nth-of-type(odd)': {
      flexDirection: 'column-reverse',
    },
  },
})

export const FeatureImageWrap = styled.div({
  maxWidth: '500px',
  maxHeight: '400px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '2px',
  overflow: 'hidden',
  boxShadow: '0 2px 0 rgb(54 45 89 / 15%), 0 0 100px rgb(54 45 89 / 20%)',

  img: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain',
  },
})

export const FeatureDescWrap = styled.div({
  maxWidth: '400px',
  wordBreak: 'break-word',
  textAlign: 'left',

  h2: {},

  span: {
    fontSize: '14px',
  },
})
