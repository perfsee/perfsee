import React, { FC } from 'react'

import { Container, ContentWrapper, Decoration, Description, Title } from './styled'

type Props = {
  title: string
  description: string
}

export const FeatureBanner: FC<Props> = ({ title, description }) => {
  return (
    <Container>
      <Decoration />
      <ContentWrapper>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </ContentWrapper>
    </Container>
  )
}
