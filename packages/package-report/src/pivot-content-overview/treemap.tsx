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

import { ICalloutProps, TooltipHost } from '@fluentui/react'
import React, { Component, FC, ReactElement, useMemo, useRef } from 'react'

import squarify from './squarify'
import { TreemapSquare as TreemapSquareDiv } from './styles'

export interface SquareProps extends Pick<React.CSSProperties, 'left' | 'top' | 'width' | 'height' | 'borderRadius'> {
  data?: string
  style: React.CSSProperties
  tooltip?: string
  children?: React.ReactNode
}
const TreemapSquare: FC<SquareProps> = ({
  children,
  left,
  top,
  width,
  height,
  borderRadius,
  data,
  style,
  tooltip,
  ...other
}) => {
  const targetRef = useRef<HTMLDivElement>(null)
  const calloutProps: ICalloutProps = useMemo(
    () => ({
      gapSpace: 0,
      target: targetRef,
      styles: {
        root: {
          whiteSpace: 'pre-line',
        },
      },
    }),
    [],
  )

  return (
    <TooltipHost content={tooltip} calloutProps={calloutProps}>
      <TreemapSquareDiv
        ref={targetRef}
        data-vals={data?.toString() + '...' + width + '...' + height}
        style={{
          left,
          top,
          width,
          height,
          borderRadius,
          ...style,
        }}
        {...other}
      >
        {children}
      </TreemapSquareDiv>
    </TooltipHost>
  )
}

export interface TreemapProps {
  width: number
  height: number
  children: ReactElement[]
}
class TreeMap extends Component<TreemapProps> {
  static Square = TreemapSquare
  render() {
    const { width, height, children, ...others } = this.props

    const values = React.Children.map(children as ReactElement[], (square) => square.props.value)

    const squared = squarify(values, width, height, 0, 0)
    const getBorderRadius = (index: number) => {
      const topLeftRadius = squared[index][0] || squared[index][1] ? '0px' : '10px'
      const topRightRadius = squared[index][1] === 0 && squared[index][2] === width ? '10px' : '0px'
      const bottomLeftRadius = squared[index][3] === height && squared[index][0] === 0 ? '10px' : '0px'
      const bottomRightRadius =
        Math.round(squared[index][3]) === height && Math.round(squared[index][2]) === width ? '10px' : '0px'

      return `${topLeftRadius} ${topRightRadius} ${bottomRightRadius} ${bottomLeftRadius}`
    }

    return (
      <div
        style={{ width: '100%', height, position: 'relative', color: 'rgba(0, 0, 0, 0.6)', fontSize: '0.9rem' }}
        {...others}
      >
        {React.Children.map(children as ReactElement[], (child, index) =>
          React.cloneElement(child, {
            left: `${(squared[index][0] / width) * 100}%`,
            top: `${(squared[index][1] / height) * 100}%`,
            width: `${((squared[index][2] - squared[index][0]) / width) * 100}%`,
            height: `${((squared[index][3] - squared[index][1]) / height) * 100}%`,
            borderRadius: getBorderRadius(index),
            data: squared[index],
          }),
        )}
      </div>
    )
  }
}

export default TreeMap
