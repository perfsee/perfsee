import styled from '@emotion/styled'

export const OperationSpan = styled.span(({ theme }) => ({
  cursor: 'pointer',
  userSelect: 'none',
  color: theme.colors.error,
}))

export const ModalContent = styled.div({
  padding: '12px 16px',
})
