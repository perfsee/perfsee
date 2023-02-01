import styled from '@emotion/styled'
import { SearchBox, Text } from '@fluentui/react'

import { Card } from '@perfsee/components'

export const CardContainer = styled(Card)({
  width: 550,
  margin: '80px auto',
  padding: '64px 88px',
})

export const SelectorContainer = styled.div(({ theme }) => ({
  width: '100%',
  border: '1px solid ' + theme.border.color,
}))

export const Title = styled.h1({
  textAlign: 'center',
  fontWeight: 600,
  fontSize: '18px',
})

export const CenterText = styled(Text)({
  textAlign: 'center',
})

export const ProjectSearchBar = styled(SearchBox)(({ theme }) => ({
  width: '100%',
  border: 'none',
  borderBottom: '1px solid ' + theme.border.color,
  borderRadius: 0,
  ':hover': {
    borderBottom: '1px solid ' + theme.border.color,
  },
}))
