import { Header } from './header'
import { LayoutWrapper } from './styled'

type Props = {
  title?: string
  description?: string
  children?: React.ReactNode
}

export const Layout: React.FC<Props> = ({ children, title: _, description: __ }) => {
  return (
    <LayoutWrapper>
      <Header />

      {children}
    </LayoutWrapper>
  )
}
