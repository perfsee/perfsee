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

import { IStackProps, IStackTokens, Stack } from '@fluentui/react'
import { FC, PropsWithChildren } from 'react'

interface SpaceProps {
  verticalAlign?: IStackProps['verticalAlign']
  reversed?: IStackProps['reversed']
  gap?: IStackTokens['childrenGap']
  wrap?: boolean
}

export const Space: FC<PropsWithChildren<SpaceProps>> = ({
  children,
  verticalAlign = 'baseline',
  reversed = false,
  gap = 10,
  wrap,
}) => {
  return (
    <Stack tokens={{ childrenGap: gap }} horizontal verticalAlign={verticalAlign} reversed={reversed} wrap={wrap}>
      {children}
    </Stack>
  )
}
