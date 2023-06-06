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

import { Text } from '@fluentui/react'
import React, { ChangeEvent, Component, FC, useCallback } from 'react'

import { lighten } from '@perfsee/dls'
import { PackageStats, PrettyBytes } from '@perfsee/shared'

import { BundleCardTitle } from '../styles'

import SearchIcon from './search-icon'
import {
  ExportAnalysisContainer,
  ExportAnalysisTopBar,
  ExportAnalysisSubtext,
  InputContainer,
  FilterInput,
  SectionList,
  DontBreak,
  LetterHeading,
  SectionPill,
  SectionPillFill,
  PillName,
  SizeUnit,
} from './styles'

function getBGClass(ratio: number) {
  if (ratio < 0.05) {
    return lighten('#7ebf80', 0.15)
  } else if (ratio < 0.15) {
    return lighten('#9bc26b', 0.15)
  } else if (ratio < 0.25) {
    return lighten('#dee675', 0.1)
  } else if (ratio < 0.4) {
    return lighten('#fff080', 0)
  } else if (ratio < 0.5) {
    return lighten('#ffd966', 0.05)
  } else if (ratio < 0.7) {
    return lighten('#ffbf66', 0.1)
  } else {
    return lighten('#ff8a66', 0.15)
  }
}

export interface ExportPillProps {
  name: string
  size: number
  path: string
  totalSize: number
  isLoading: boolean
}

class ExportPill extends React.Component<ExportPillProps> {
  render() {
    const { name, size, totalSize } = this.props
    return (
      <SectionPill>
        <SectionPillFill
          style={{
            transform: `scaleX(${Math.min((size || 0) / totalSize, 1)})`,
            backgroundColor: getBGClass(size / totalSize),
          }}
        />
        <PillName>{name}</PillName>
        {size && (
          <Text>
            {PrettyBytes.create(size).value}
            <SizeUnit>{PrettyBytes.create(size).unit}</SizeUnit>
          </Text>
        )}
      </SectionPill>
    )
  }
}

interface ExportListProps {
  isLoading: boolean
  totalSize: number
  exports: {
    name: string
    gzip: number
    path: string
  }[]
}
const ExportList: FC<ExportListProps> = ({ exports, totalSize, isLoading }) => {
  const shouldShowLabels = exports.length > 20
  const exportDictionary: Record<
    string,
    {
      gzip: number
      name: string
      path: string
    }[]
  > = {}
  let curIndex = 0

  exports.forEach((exp) => {
    const firstLetter = exp.name[0].toLowerCase()
    if (exportDictionary[firstLetter]) {
      exportDictionary[firstLetter].push(exp)
    } else {
      exportDictionary[firstLetter] = [exp]
    }
  })

  return (
    <SectionList>
      {Object.keys(exportDictionary)
        .sort()
        .map((letter) => (
          <div key={letter}>
            {shouldShowLabels && (
              <DontBreak>
                <LetterHeading>{letter}</LetterHeading>
                <ExportPill
                  size={exportDictionary[letter][0].gzip}
                  totalSize={totalSize}
                  name={exportDictionary[letter][0].name}
                  path={exportDictionary[letter][0].path}
                  key={exportDictionary[letter][0].name}
                  isLoading={curIndex++ < 40 && isLoading}
                />
              </DontBreak>
            )}
            {exportDictionary[letter].slice(shouldShowLabels ? 1 : 0).map((exp) => (
              <ExportPill
                size={exp.gzip}
                totalSize={totalSize}
                name={exp.name}
                path={exp.path}
                key={exp.name}
                isLoading={curIndex++ < 40 && isLoading}
              />
            ))}
          </div>
        ))}
    </SectionList>
  )
}

function InputExportFilter({ onChange }: { onChange: (val: string) => void }) {
  const changeHandler = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value.toLowerCase().trim()),
    [onChange],
  )

  return (
    <InputContainer>
      <FilterInput placeholder="Filter methods" type="text" onChange={changeHandler} />
      <SearchIcon />
    </InputContainer>
  )
}

interface ExportAnalysisSectionProps {
  result: PackageStats
}
class ExportAnalysisSection extends Component<ExportAnalysisSectionProps> {
  state = {
    assets: [] as PackageStats['assets'],
    filterText: '',
  }

  componentDidMount() {
    const isCompatible = !this.getIncompatibleMessage()

    if (isCompatible) {
      this.startAnalysis()
    }
  }

  startAnalysis = () => {
    const { result } = this.props
    this.setState({
      assets: result.assets.filter((asset) => asset.type === 'js'),
    })
  }

  handleFilterInputChange = (value: string) => {
    this.setState({ filterText: value })
  }

  getIncompatibleMessage() {
    const { result } = this.props
    let incompatibleMessage = ''

    if (!(result.hasJSModule || result.hasJSNext || result.isModuleType)) {
      incompatibleMessage = 'This package does not export ES6 modules.'
    } else if (result.hasSideEffects === true) {
      incompatibleMessage = "This package exports ES6 modules, but isn't marked side-effect free."
    }
    return incompatibleMessage
  }

  renderIncompatible() {
    return (
      <>
        <BundleCardTitle>Exports Analysis</BundleCardTitle>
        <ExportAnalysisSubtext>
          Exports analysis is available only for packages that export ES Modules and are side-effect free. <br />
          {this.getIncompatibleMessage()}
        </ExportAnalysisSubtext>
      </>
    )
  }

  renderSuccess() {
    const { result } = this.props
    const { gzip: totalSize } = result
    const { assets, filterText } = this.state

    const normalizedExports = assets

    const matchedExports = normalizedExports.filter((asset) =>
      filterText ? asset.name.toLowerCase().includes(filterText) : true,
    )

    return (
      <>
        <ExportAnalysisTopBar>
          <BundleCardTitle>GZIP sizes of individual exports</BundleCardTitle>
          {normalizedExports.length > 15 && <InputExportFilter onChange={this.handleFilterInputChange} />}
        </ExportAnalysisTopBar>

        <ExportList
          isLoading={false}
          totalSize={totalSize}
          // @ts-expect-error
          exports={matchedExports}
        />
      </>
    )
  }

  render() {
    return (
      <ExportAnalysisContainer>
        {this.getIncompatibleMessage() ? this.renderIncompatible() : this.renderSuccess()}
      </ExportAnalysisContainer>
    )
  }
}

export default ExportAnalysisSection
