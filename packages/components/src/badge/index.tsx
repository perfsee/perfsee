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

import { FC, ReactNode } from 'react'

import { StyledBadge, NumberBadge, DotBadge } from './style'

type Props = {
  dot?: boolean
  count?: number
  color?: string
  children?: ReactNode
}

export const Badge: FC<Props> = (props) => {
  const { count, dot } = props
  return (
    <StyledBadge color={props.color}>
      {props.children}
      {typeof count === 'number' ? <NumberBadge>{count}</NumberBadge> : dot ? <DotBadge /> : null}
    </StyledBadge>
  )
}
