/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
