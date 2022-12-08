import styled from '@emotion/styled'

export const WebhooksTable = styled.div(({ theme }) => ({
  border: `1px solid ${theme.border.color}`,
  borderRadius: theme.border.radius,
}))

export const WebhooksTableItem = styled.div(({ theme }) => ({
  padding: '16px 16px',
  ':not(:last-child)': {
    borderBottom: `1px solid ${theme.border.color}`,
  },
}))

export const WebhooksDescription = styled.div(({ theme }) => ({
  color: theme.text.colorSecondary,
}))

export const WebhookEditAction = styled.span(({ theme }) => ({
  color: theme.text.color,
  cursor: 'pointer',
}))

export const WebhookRemoveAction = styled.span(({ theme }) => ({
  color: theme.colors.error,
  cursor: 'pointer',
}))
