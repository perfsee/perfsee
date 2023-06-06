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

import { cloneDeep } from 'lodash'
import { Component } from 'react'

import { PackageStats, PrettyBytes } from '@perfsee/shared'

import {
  TreemapSectionContainer,
  TreemapNote,
  TreemapContent,
  TreemapLabel,
  TreemapPercent,
  TreemapSign,
  TreemapEllipsis,
  BundleCardTitle,
} from './styles'
import Treemap from './treemap'

const colors = [
  '#718af0',
  '#6e98e6',
  '#79c0f2',
  '#7dd6fa',
  '#6ed0db',
  '#59b3aa',
  '#7ebf80',
  '#9bc26b',
  '#dee675',
  '#fff080',
  '#ffd966',
  '#ffbf66',
  '#ff8a66',
  '#ed7872',
  '#db6b8f',
  '#bd66cc',
  '#cae0eb',
]

interface TreemapSectionProps {
  packageName: string
  packageSize: number
  dependencySizes: PackageStats['dependencySizes'] extends (infer S)[] | undefined
    ? (S & {
        isSelf?: boolean
        percentShare?: number
        sizeShare?: number
        tooltip?: string
        isOthers?: boolean
      })[]
    : never
}

class TreemapSection extends Component<TreemapSectionProps> {
  state = {
    width: 0,
    height: 0,
  }

  private treemapSection: HTMLElement | null = null

  componentDidMount() {
    const { dependencySizes = [] } = this.props
    const width = this.treemapSection?.getBoundingClientRect().width
    let heightMultiplier = 1

    if (dependencySizes.length < 5) {
      heightMultiplier = 0.5
    } else if (dependencySizes.length <= 10) {
      heightMultiplier = 0.7
    } else if (dependencySizes.length <= 15) {
      heightMultiplier = 1.1
    }

    let height = 250 * heightMultiplier

    if (window.innerWidth <= 640) {
      height = window.innerHeight * 0.65 * heightMultiplier
    } else if (window.innerWidth <= 768) {
      height = window.innerHeight * 0.45 * heightMultiplier
    }
    this.setState({
      width,
      height,
    })
  }

  render() {
    const { packageName, packageSize, dependencySizes = [] } = this.props
    const { width, height } = this.state

    const getFormattedSize = (value: number) => {
      const { unit, value: size } = PrettyBytes.create(value)
      return `${size} ${unit}`
    }

    let depdendenciesCopy = cloneDeep(dependencySizes)
    depdendenciesCopy.forEach((dep) => {
      if (dep.name === packageName) {
        dep.name = '(self)'
        dep.isSelf = true
      }
    })

    const sizeSum = depdendenciesCopy.reduce((acc, dep) => acc + dep.approximateSize, 0)
    depdendenciesCopy = depdendenciesCopy
      .map((dep) => ({
        ...dep,
        percentShare: (dep.approximateSize / sizeSum) * 100,
        // The size given by the API is after performing
        // minimal minification on the dependency source –
        // whitespace removal, dead code removal etc.
        // whereas the displayed size of the package searched by the user
        // is after full minification. We use the ratio from approximate
        // sizes to predict what these dependencies possibly weighed if
        // they were also minified completely instead of partially
        sizeShare: (dep.approximateSize / sizeSum) * packageSize,
      }))
      .map((dep) => ({
        ...dep,
        tooltip: `${dep.name} ｜ ${dep.percentShare.toFixed(1)}% ｜ ~ ${getFormattedSize(dep.sizeShare)}`,
      }))

    depdendenciesCopy.sort((depA, depB) => {
      return depB.percentShare ?? 0 - (depA.percentShare ?? 0)
    })

    let compactedDependencies = []

    const compactLimit = window.innerWidth <= 768 ? 8 : 16
    const ellipsizeLimit = window.innerWidth <= 768 ? 3.5 : 1.5
    if (depdendenciesCopy.length > compactLimit) {
      const otherDependencies = depdendenciesCopy.slice(compactLimit)
      compactedDependencies = depdendenciesCopy.slice(0, compactLimit)

      const approximateSize = otherDependencies.reduce((acc, dep) => acc + dep.approximateSize, 0)
      const percentShare = otherDependencies.reduce((acc, dep) => acc + (dep.percentShare ?? 0), 0)
      const sizeShare = otherDependencies.reduce((acc, dep) => acc + (dep.sizeShare ?? 0), 0)

      compactedDependencies.push({
        name: '(others)',
        approximateSize,
        percentShare,
        sizeShare,
        isOthers: true,
        tooltip: otherDependencies
          .map(
            (dep) =>
              `${dep.name} ｜ ${(dep.percentShare ?? 0).toFixed(1)}% ｜ ~ ${getFormattedSize(dep.sizeShare ?? 0)} min`,
          )
          .join(' \u000D\u000A  \u000D\u000A '),
      })
    } else {
      compactedDependencies = depdendenciesCopy
    }

    return (
      // eslint-disable-next-line
      <TreemapSectionContainer ref={(ts) => (this.treemapSection = ts)}>
        <BundleCardTitle> Composition </BundleCardTitle>
        <Treemap width={width} height={height}>
          {compactedDependencies.map((dep, index) => (
            <Treemap.Square
              key={dep.name}
              value={dep.percentShare}
              style={{ background: colors[index % colors.length] }}
              tooltip={dep.tooltip}
            >
              {(dep.percentShare ?? 0) > ellipsizeLimit &&
              dep.name.length < (dep.percentShare ?? 0) * (12 / ellipsizeLimit) ? (
                <TreemapContent>
                  <TreemapLabel>
                    {dep.isSelf || dep.isOthers ? (
                      <span> {dep.name} </span>
                    ) : (
                      <a href={`https://npmjs.com/package/${dep.name}`} target="_blank" rel="noopener noreferrer">
                        {dep.name}
                      </a>
                    )}
                  </TreemapLabel>
                  <TreemapPercent
                    style={{
                      fontSize: `${14 + Math.min((dep.percentShare ?? 0) * 1.2, 25)}px`,
                    }}
                  >
                    {(dep.percentShare ?? 0).toFixed(1)}
                    <TreemapSign>%</TreemapSign>
                  </TreemapPercent>
                </TreemapContent>
              ) : (
                <TreemapEllipsis>&hellip;</TreemapEllipsis>
              )}
            </Treemap.Square>
          ))}
        </Treemap>
        <TreemapNote>
          <b>Note: </b> These sizes represent the contribution made by dependencies (direct or transitive) to{' '}
          <code>{packageName}</code>'s size. These may be different from the dependencies' standalone sizes.
        </TreemapNote>
      </TreemapSectionContainer>
    )
  }
}

export default TreemapSection
