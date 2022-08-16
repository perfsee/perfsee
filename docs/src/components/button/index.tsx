import styled from '@emotion/styled'

export const Button = styled.a({
  padding: '10px 12px',
  fontSize: '16px',
  lineHeight: '20px',
  display: 'block',
  textAlign: 'center',
  border: 'none',
  outline: 'none',
  cursor: 'pointer',

  borderRadius: '20px',
  fontWeight: 'bold',

  ':hover, :active, :focus': {
    textDecoration: 'none',
  },
})

export const DefaultButton = styled(Button)({
  width: '169px',
  backgroundColor: '#fff',
  color: '#000',

  ':hover': {
    color: '#000',
  },
})

export const PrimaryButton = styled(Button)({
  width: '169px',
  backgroundColor: '#000',
  color: '#fff',

  ':hover': {
    color: '#fff',
  },
})

const MediumButton = styled(Button)({
  padding: '4px 8px',
  fontSize: '14px',
  lineHeight: '24px',
  width: '80px',
})

export const MediumDefaultButton = styled(MediumButton)({
  backgroundColor: 'rgba(0, 0, 0, 0.05)',
  color: '#000',

  ':hover': {
    color: '#000',
  },
})

export const MediumPrimaryButton = styled(MediumButton)({
  backgroundColor: '#2f6eb8',
  color: '#fff',

  ':hover': {
    color: '#fff',
  },
})
