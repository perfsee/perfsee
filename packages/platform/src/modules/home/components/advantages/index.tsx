import KeySvg from '../../assets/key.svg'
import RadarSvg from '../../assets/radar.svg'
import TipsSvg from '../../assets/tips.svg'
import WaterfallSvg from '../../assets/waterfalls.svg'

import { Card, Container, IconWrap } from './styled'

export const Advantages = () => {
  return (
    <Container>
      <Card>
        <IconWrap bgColor="#e1eaff">
          <RadarSvg />
        </IconWrap>
        <h2>In-depth details and analysis</h2>
        <span>
          Pioneering analyze front-end application's performance from perspectives, including packaged products,
          integrated test environments, and back to source code.
        </span>
      </Card>
      <Card>
        <IconWrap bgColor="#d5f6f2">
          <TipsSvg />
        </IconWrap>
        <h2>Lower threshold for performance analysis</h2>
        <span>
          Provide professional optimization advice based on multiple perspectives. Even newcomers with little experience
          in performance optimization can follow the diagram.
        </span>
      </Card>
      <Card>
        <IconWrap bgColor="#d9f3fd">
          <KeySvg />
        </IconWrap>
        <h2>Bridging the R&D process</h2>
        <span>
          From development to deployment, the Perfsee toolset has been permeated through the development process,
          tracking performance changes between releases in real time.
        </span>
      </Card>
      <Card>
        <IconWrap bgColor="#d9f5d6">
          <WaterfallSvg />
        </IconWrap>
        <h2>Data interfacing with RUM</h2>
        <span>
          Based on RUM data, gives further guidance on performance analysis and comparison with the online version.
        </span>
      </Card>
    </Container>
  )
}
