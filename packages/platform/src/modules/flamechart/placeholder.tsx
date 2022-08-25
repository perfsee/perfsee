import styled from '@emotion/styled'
import { FC, PropsWithChildren } from 'react'

import { FlameIcon } from '@perfsee/components'
import { NeutralColors } from '@perfsee/dls'

const Container = styled.div({
  height: '100%',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
})

const Text = styled.p({
  padding: '32px 16px',
  fontSize: '38px',
  lineHeight: 1.6,
  color: NeutralColors.gray50,
  fontWeight: 600,
  textAlign: 'center',
  textTransform: 'uppercase',
})

const PlaceHolderIcon = styled(FlameIcon)({
  width: '200px',
  height: '200px',
  color: NeutralColors.gray50,
})

export const FlamechartPlaceholder: FC<PropsWithChildren<any>> = ({ children }) => {
  return (
    <Container>
      <PlaceHolderIcon />
      {children && <Text>{children}</Text>}
    </Container>
  )
}
