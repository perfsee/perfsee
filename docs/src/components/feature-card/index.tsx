import React from 'react'

import { Container, ContentWrapper, Description, ImageWrapper, Title } from './styled'

type Props = {
  title?: string
  description: string
  img: string
  reverse?: boolean
}

export const FeatureCard: React.FC<Props> = ({ title, description, img, reverse = false }) => {
  return (
    <Container reverse={reverse}>
      <ContentWrapper>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </ContentWrapper>
      <ImageWrapper>
        <img src={img} alt={title} />
      </ImageWrapper>
    </Container>
  )
}
