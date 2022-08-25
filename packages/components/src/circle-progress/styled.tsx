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

const mainColor = 'rgb(255, 164, 0)'
const secondColor = 'rgb(255, 246, 230)'

export const Container = styled.div<{ size: number; color?: string; backgroundColor?: string }>(
  ({ size, color, backgroundColor }) => ({
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: backgroundColor ?? secondColor,
    color: color ?? mainColor,
    fontSize: '18px',
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    userSelect: 'none',
  }),
)

const BorderBase = styled.div<{ deg: string; size: number; color?: string }>(({ size }) => ({
  width: `${size / 2}px`,
  height: `${size}px`,
  position: 'absolute',
  top: 0,
  overflow: 'hidden',
}))

export const BorderLeft = styled(BorderBase)(({ deg, size, color }) => ({
  left: 0,

  '::before': {
    content: '""',
    width: `${size}px`,
    height: `${size}px`,
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: '50%',
    boxSizing: 'border-box',
    border: '4px solid transparent',
    borderBottom: `4px solid ${color ?? mainColor}`,
    borderLeft: `4px solid ${color ?? mainColor}`,
    transform: `rotate(${deg})`,
  },
}))

export const BorderRight = styled(BorderBase)(({ deg, size, color }) => ({
  right: 0,
  '::after': {
    content: '""',
    width: `${size}px`,
    height: `${size}px`,
    position: 'absolute',
    right: 0,
    top: 0,
    boxSizing: 'border-box',
    borderRadius: '50%',
    border: '4px solid transparent',
    borderTop: `4px solid ${color ?? mainColor}`,
    borderRight: `4px solid ${color ?? mainColor}`,
    transform: `rotate(${deg})`,
  },
}))
