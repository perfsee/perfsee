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

import { FC, useMemo } from 'react'

import { Container, BorderLeft, BorderRight } from './styled'

export interface CircleProgressProps {
  percent: number
  size?: number
  color?: string
  backgroundColor?: string
}

export const CircleProgress: FC<CircleProgressProps> = (props) => {
  const { percent = 0, size = 50, color, backgroundColor } = props

  const leftDeg = useMemo(() => {
    if (percent < 50) {
      return '-135deg'
    }

    const diff = ((percent - 50) / 50) * 180
    return `${-135 + diff}deg`
  }, [percent])

  const rightDeg = useMemo(() => {
    if (percent >= 50) {
      return '45deg'
    }

    const diff = (percent / 50) * 180
    return `${-135 + diff}deg`
  }, [percent])

  return (
    <Container size={size} color={color} backgroundColor={backgroundColor}>
      <BorderLeft deg={leftDeg} size={size} color={color} />
      <BorderRight deg={rightDeg} size={size} color={color} />
      {percent}
    </Container>
  )
}
