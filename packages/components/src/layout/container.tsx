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
import { useDispatchers, useModuleState } from '@sigi/react'
import { FC, PropsWithChildren, useEffect } from 'react'

import { LayoutModule } from './layout.module'

export function useWideScreen() {
  const { setWideScreen } = useDispatchers(LayoutModule)

  useEffect(() => {
    setWideScreen(true)

    return () => {
      setWideScreen(false)
    }
  }, [setWideScreen])
}

export const BodyContainer: FC<PropsWithChildren> = ({ children }) => {
  const { wide } = useModuleState(LayoutModule)

  return <BodyContainerInner wide={wide}>{children}</BodyContainerInner>
}

const BodyContainerInner = styled.div<{ wide?: boolean }>(({ theme, wide }) => ({
  minHeight: '70%',
  display: 'flex',
  flexDirection: 'column',
  padding: `20px ${theme.layout.mainPadding} 0`,
  ...(wide
    ? {
        width: '100%',
      }
    : {
        maxWidth: theme.layout.mainMaxWidth,
        marginLeft: 'auto',
        marginRight: 'auto',
      }),
}))

export const BodyPadding = styled.div(({ theme }) => ({
  backgroundColor: theme.colors.white,
  width: '100%',
  margin: '20px 0 50px',
  padding: '16px 24px',
  borderRadius: '2px',
  overflow: 'hidden',
}))
