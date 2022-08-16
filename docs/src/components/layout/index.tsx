import { PageMetadata } from '@docusaurus/theme-common'
import Footer from '@theme/Footer'
import React from 'react'

import { Header } from './header'
import { LayoutWrapper } from './styled'

type Props = {
  title?: string
  description?: string
  children?: React.ReactNode
}

export const Layout: React.FC<Props> = ({ children, title, description }) => {
  return (
    <>
      <LayoutWrapper>
        <PageMetadata title={title} description={description} />

        <Header />

        {children}

        <Footer />
      </LayoutWrapper>
    </>
  )
}
