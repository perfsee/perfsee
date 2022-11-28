import styled from '@emotion/styled'

import { DefaultButton } from '../button'

export const Container = styled.div({
  textAlign: 'center',
  marginBottom: '120px',
})

export const CardsContainer = styled.div({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  margin: '30px auto',

  '@media(max-width: 960px)': {
    flexDirection: 'column',
  },
})

export const PriceCard = styled.div({
  width: '380px',
  padding: '0 24px',
  backgroundColor: '#fff',
  overflow: 'hidden',
  borderRadius: '4px',
  boxShadow: `0px 0px 1px 1px #eee`,
  cursor: 'pointer',
  transition: 'all 0.2s 0s ease',

  ':hover': {
    boxShadow: '0px 0px 6px 2px #eee',
    transform: 'scale(1.05)',
    transformOrigin: '50% 50%',
  },

  '& + &': {
    marginLeft: '80px',
  },

  '@media(max-width: 960px)': {
    '& + &': {
      marginLeft: '0',
      marginTop: '48px',
    },
  },
})

export const PriceCardHead = styled.div({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  fontSize: '18px',
  fontWeight: 600,
  padding: '12px 0 ',
  borderBottom: `1px solid #ddd`,
})

export const PriceCardDescription = styled.div({
  padding: '8px',
  fontSize: '12px',
  color: '#aaa',
  whiteSpace: 'break-spaces',
})

export const PriceContent = styled.div({
  padding: '4px 0',
})

export const PriceContentItem = styled.div({
  display: 'flex',
  alignItems: 'center',
  marginBottom: '6px',
})

export const PriceContentItemIcon = styled.div({
  color: 'green',
  fontSize: '12px',
  marginRight: '8px',
})

export const ButtonWrap = styled.div({
  margin: '8px 0 16px',
  display: 'flex',
  justifyContent: 'center',
})

export const BorderedButton = styled(DefaultButton)({
  background: `linear-gradient(#fff, #fff) padding-box,
  linear-gradient(130deg, #5eebcb 0, #2f6eb8 100%) border-box`,
  border: `1px solid transparent`,
})
