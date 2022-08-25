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

import { keyframes } from '@emotion/react'
import styled from '@emotion/styled'

const loadingKeyframes = keyframes`
  0% {
    opacity: 0.1;
  }

  50% {
    opacity: 0.2;
  }

  100% {
    opacity: 0.1;
  }
`

export const SimpleBarChartContainer = styled.div<{ loadingAnimation?: boolean }>(({ loadingAnimation }) => ({
  display: 'block',
  lineHeight: '25px',
  height: '25px',
  animation: loadingAnimation ? `${loadingKeyframes} 1s ease infinite` : '',
}))

export const SimpleBarChartItem = styled.div({
  display: 'inline-block',
  margin: '0 1px',
  height: '25px',
  width: '8px',
  opacity: 0.4,
  transform: 'scaleY(-1)',
  transition: '150ms opacity, 150ms transform',
  lineHeight: '1',
  ':hover': {
    opacity: 1,
  },
})

export const SimpleBarChartProgress = styled.div<{ height: string; color: string }>(({ height, color }) => ({
  minHeight: '2px',
  height,
  background: color,
  pointerEvents: 'none',
}))

export const SimpleBarChartValueText = styled.span({
  margin: '0 8px',
  verticalAlign: 'top',
  fontSize: '14px',
  fontWeight: 600,
})
