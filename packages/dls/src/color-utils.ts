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

import { hexToRgb, rgbToHsl, hslToRgb, rgbToHex } from 'color-converters'

function percentileToNumber(percentile: string, max = 255) {
  return (parseInt(percentile) * max) / 100
}

export function stringToRgba(color: string): [number, number, number, number] {
  if (/^#[0-9a-f]{3,6}/i.test(color)) {
    return [...hexToRgb(color), 1]
  }

  const match = color.replace(/\s/g, '').match(/^rgba?\((\d+%?),(\d+%?),(\d+%?),?(0?\.\d+)?\)$/i)
  if (match) {
    const alpha = match[3]?.startsWith('0.') ? parseInt(match[3]) : parseInt('0' + (match[3] ?? 1))

    return [percentileToNumber(match[0]), percentileToNumber(match[1]), percentileToNumber(match[2]), alpha]
  }

  // avoid runtime error
  return [0, 0, 0, 1]
}

export function stringToRgb(color: string): [number, number, number] {
  return stringToRgba(color).slice(0, 3) as [number, number, number]
}

export function darken(color: string, ratio: number) {
  const [h, s, l] = rgbToHsl(stringToRgb(color))
  return rgbToHex(hslToRgb([h, s, l - l * ratio]))
}

export function lighten(color: string, ratio: number) {
  const [h, s, l] = rgbToHsl(stringToRgb(color))
  return rgbToHex(hslToRgb([h, s, l + l * ratio]))
}

export function alpha(color: string, ratio: number) {
  const [r, g, b, a] = stringToRgba(color)
  return `rgba(${r}, ${g}, ${b}, ${a * ratio})`
}
