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

import { TooltipHost } from '@fluentui/react'
import { PureComponent } from 'react'

import { TreeShakeIcon, SideEffectIcon } from '@perfsee/components/icon'
import { PrettyBytes } from '@perfsee/shared'

import {
  BarContainer,
  BarGroup,
  BarSymbol,
  BarSymbols,
  Graph,
  GraphBar,
  GraphBar2,
  BarVersion,
  BarLegend,
  LegendBar1,
  LegendBar2,
  ColorBox,
  GraphBarDisabled,
  BarGroupDisbaled,
} from './styles'

export interface Reading {
  version: string
  size: number
  gzip: number
  disabled: boolean
  hasSideEffects?: boolean | null
  hasJSModule?: boolean | null
  hasJSNext?: boolean | null
  isModuleType?: boolean | null
  packageId: number
  id: number
}

export interface BarGraphProps {
  readings: Reading[]
  showVersion?: boolean
  height?: number
  onBarClick: (readings: Reading) => void
}

export const PLACE_HOLDER_PACKAGE_ID = -1

export default class BarGraph extends PureComponent<BarGraphProps> {
  getScale = () => {
    const { readings } = this.props

    const gzipValues = readings.filter((reading) => !reading.disabled).map((reading) => reading.gzip)

    const sizeValues = readings.filter((reading) => !reading.disabled).map((reading) => reading.size)

    const maxValue = Math.max(...[...gzipValues, ...sizeValues])
    return 100 / maxValue
  }

  getFirstSideEffectFreeIndex = () => {
    const { readings } = this.props
    const sideEffectFreeIntroducedRecently = !readings.every((reading) => !reading.hasSideEffects)
    const firstSideEffectFreeIndex = readings.findIndex((reading) => !(reading.disabled || reading.hasSideEffects))

    return sideEffectFreeIntroducedRecently ? firstSideEffectFreeIndex : -1
  }

  getFirstTreeshakeableIndex = () => {
    const { readings } = this.props
    const treeshakingIntroducedRecently = !readings.every((reading) => reading.hasJSModule)
    const firstTreeshakingIndex = readings.findIndex(
      (reading) => !reading.disabled && (reading.hasJSModule || reading.hasJSNext || reading.isModuleType),
    )

    return treeshakingIntroducedRecently ? firstTreeshakingIndex : -1
  }

  renderPlaceHolder = (reading: Reading) => {
    const version = this.props.showVersion ? <BarVersion>{reading.version}</BarVersion> : null
    return (
      <BarGroupDisbaled key={reading.id} style={{ pointerEvents: 'none' }}>
        <GraphBarDisabled style={{ height: `${40}%` }} />
        {version}
      </BarGroupDisbaled>
    )
  }

  renderDisabledBar = (reading: Reading) => {
    const version = this.props.showVersion ? <BarVersion>{reading.version}</BarVersion> : null
    return (
      // eslint-disable-next-line react/jsx-no-bind
      <BarGroupDisbaled key={reading.id} onClick={() => this.props.onBarClick(reading)}>
        <TooltipHost
          content={`Version: ${reading.version} Unable to get size`}
          styles={{ root: { height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'end' } }}
        >
          <GraphBarDisabled style={{ height: `${50}%` }} />
        </TooltipHost>
        {version}
      </BarGroupDisbaled>
    )
  }

  renderActiveBar = (
    reading: Reading,
    scale: number,
    options: { isFirstTreeshakeable: boolean; isFirstSideEffectFree: boolean },
  ) => {
    const getTooltipMessage = (reading: Reading) => {
      const formattedSize = PrettyBytes.create(reading.size)
      const formattedGzip = PrettyBytes.create(reading.gzip)
      return (
        <span style={{ whiteSpace: 'pre-line' }}>
          {`Version: ${reading.version}\nMinified: ${formattedSize.value}${formattedSize.unit} | Gzipped: ${formattedGzip.value}${formattedGzip.unit}`}
        </span>
      )
    }

    const symbols = (
      <BarSymbols>
        {options.isFirstTreeshakeable && (
          <TooltipHost
            content={`ES2015 exports introduced. ${
              reading.hasSideEffects ? 'Not side-effect free yet, hence limited tree-shake ability.' : ''
            }`}
          >
            <BarSymbol>
              <TreeShakeIcon />
            </BarSymbol>
          </TooltipHost>
        )}
        {options.isFirstSideEffectFree && (
          <TooltipHost
            content={`Was marked side-effect free. ${
              reading.hasJSNext || reading.hasJSModule || reading.isModuleType
                ? 'Supports ES2015 exports also, hence fully tree-shakeable'
                : "Doesn't export ESM yet, limited tree-shake ability"
            }`}
          >
            <BarSymbol>
              <SideEffectIcon />
            </BarSymbol>
          </TooltipHost>
        )}
      </BarSymbols>
    )
    const version = this.props.showVersion ? <BarVersion>{reading.version}</BarVersion> : null

    return (
      // eslint-disable-next-line react/jsx-no-bind
      <BarGroup onClick={() => this.props.onBarClick(reading)} key={reading.id}>
        <TooltipHost
          content={getTooltipMessage(reading)}
          styles={{
            root: {
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'end',
            },
          }}
        >
          {symbols}
          <GraphBar style={{ height: `${(reading.size - reading.gzip) * scale}%` }} />
          <GraphBar2 style={{ height: `${reading.gzip * scale}%` }} />
        </TooltipHost>
        {version}
      </BarGroup>
    )
  }

  render() {
    const { readings } = this.props
    const graphScale = this.getScale()
    const firstTreeshakeableIndex = this.getFirstTreeshakeableIndex()
    const firstSideEffectFreeIndex = this.getFirstSideEffectFreeIndex()

    return (
      <BarContainer style={{ height: this.props.height }}>
        <Graph>
          {readings.map((reading, index) => {
            return reading.disabled
              ? reading.packageId === PLACE_HOLDER_PACKAGE_ID
                ? this.renderPlaceHolder(reading)
                : this.renderDisabledBar(reading)
              : this.renderActiveBar(reading, graphScale, {
                  isFirstTreeshakeable: index === firstTreeshakeableIndex,
                  isFirstSideEffectFree: index === firstSideEffectFreeIndex,
                })
          })}
        </Graph>
        <BarLegend>
          <LegendBar1>
            <ColorBox />
            Min
          </LegendBar1>
          <LegendBar2>
            <ColorBox />
            GZIP
          </LegendBar2>
        </BarLegend>
      </BarContainer>
    )
  }
}
