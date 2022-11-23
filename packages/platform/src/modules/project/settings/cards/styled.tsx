import styled from '@emotion/styled'

export const CardContainer = styled.div({
  margin: '16px 0',
  display: 'grid',
  gridGap: '16px 24px',
  gridTemplateColumns: '1fr 1fr 1fr',
})

export const CardWrapper = styled.div(({ theme }) => ({
  border: `1px solid ${theme.border.color}`,
  borderRadius: '2px',
}))
