import styled from '@emotion/styled'

export const Container = styled.div({
  margin: '60px 0 150px',
  padding: '0 60px',

  display: 'flex',
  justifyContent: 'space-around',

  '@media(max-width: 960px)': {
    flexWrap: 'wrap',
  },

  '@media(max-width: 480px)': {
    margin: '60px 0 90px',
  },
})

export const Card = styled.div({
  maxWidth: '320px',
  minWidth: '230px',
  padding: '10px',
  textAlign: 'center',
  marginBottom: '30px',

  h2: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '12px 0',
  },

  span: {
    fontSize: '14px',
  },
})

export const IconWrap = styled.div<{ bgColor: string }>(({ bgColor }) => ({
  width: '48px',
  height: '48px',
  margin: '0 auto',
  borderRadius: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: bgColor,

  svg: {
    width: '24px',
    height: '24px',
  },
}))
