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

import { SharedColors, NeutralColors, lighten } from '@perfsee/dls'

const barWidth = '20px'
const minBarWidth = '10px'
const barGrowDuration = '0.4s'

const grow = keyframes`
from {
	transform: scaleY(0);
}

to {
	transform: scaleY(1);
}
`

export const BarContainer = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: end;
  width: 100%;
  height: 60px;
  max-height: 480px;
  margin-top: 8px;
`

export const Graph = styled.figure`
  display: flex;
  margin: 0;
  justify-content: center;
`
export const BarGroup = styled.div`
  position: relative;
  height: 100%;
  margin: 0 3px;
  display: flex;
  width: ${barWidth};
  min-width: ${minBarWidth};
  justify-content: flex-end;
  flex-direction: column;
  animation: ${grow} ${barGrowDuration} cubic-bezier(0.305, 0.42, 0.205, 1.2);
  transform-origin: 100% 100%;

  &:hover {
    filter: brightness(1.1);
  }
`

export const BarGroupDisbaled = styled(BarGroup)`
  &:hover {
    filter: brightness(0.9);
  }
`

export const BarSymbols = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: -500%;
`

export const BarSymbol = styled.div`
  text-align: center;

  svg {
    height: 18px;
    width: auto;
  }

  & + & {
    margin-top: 3px;
  }
`

const GraphBarBase = styled.div`
  width: 100%;
  left: 0;
  bottom: 0;
  transition: background 0.2s;
  cursor: pointer;
`

export const GraphBar = styled(GraphBarBase)`
  background: ${lighten(SharedColors.cyanBlue10, 0.7)};
`

export const GraphBarDisabled = styled(GraphBarBase)`
  background: ${NeutralColors.gray30};
`

export const GraphBar2 = styled(GraphBarBase)`
  background: ${lighten(SharedColors.cyanBlue20, 0.7)};
  z-index: 1;
`

export const BarVersion = styled.div`
  font-size: 1rem;
  z-index: 33;
  font-weight: 300;
  height: 16px;
  transform: rotate(-90deg) translateX(-15px);
  font-variant-numeric: tabular-nums;
  color: ${NeutralColors.gray90};
  transition: opacity 0.2s, color 0.2s;
  letter-spacing: -1px;
  direction: rtl;
  line-height: 1;
  cursor: pointer;
  margin-top: 8px;
  max-height: ${barWidth};
`

export const BarLegend = styled.div`
  margin-left: 64px;
  flex-direction: column;
  display: flex;
  text-transform: uppercase;
  justify-content: space-around;

  > div {
    display: flex;
    align-items: center;
  }
`

export const LegendBar1 = styled.div`
  margin-right: 40px;

  > div {
    background: ${lighten(SharedColors.cyanBlue10, 0.7)};
  }
`

export const LegendBar2 = styled.div`
  > div {
    background: ${lighten(SharedColors.cyanBlue20, 0.7)};
  }
`
export const ColorBox = styled.div`
  width: 8px;
  height: 8px;
  margin-right: 10px;
  border-radius: 3px;
`
