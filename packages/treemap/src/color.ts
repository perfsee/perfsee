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

import { clamp } from './math'

export class Color {
  static fromLumaChromaHue(L: number, C: number, H: number) {
    // 0 <= L <= 1
    // 0 <= C <= 1
    // 0 <= H <= 360
    // https://en.wikipedia.org/wiki/HSL_and_HSV#From_luma/chroma/hue

    const hPrime = H / 60
    const X = C * (1 - Math.abs((hPrime % 2) - 1))
    const [R1, G1, B1] =
      hPrime < 1
        ? [C, X, 0]
        : hPrime < 2
        ? [X, C, 0]
        : hPrime < 3
        ? [0, C, X]
        : hPrime < 4
        ? [0, X, C]
        : hPrime < 5
        ? [X, 0, C]
        : [C, 0, X]

    const m = L - (0.3 * R1 + 0.59 * G1 + 0.11 * B1)

    return new Color(clamp(R1 + m, 0, 1), clamp(G1 + m, 0, 1), clamp(B1 + m, 0, 1), 1.0)
  }

  static fromCSSHex(hex: string) {
    if (hex.length !== 7 || hex[0] !== '#') {
      throw new Error(`Invalid color input ${hex}`)
    }
    const r = parseInt(hex.substr(1, 2), 16) / 255
    const g = parseInt(hex.substr(3, 2), 16) / 255
    const b = parseInt(hex.substr(5, 2), 16) / 255
    if (r < 0 || r > 1 || g < 0 || g > 1 || b < 0 || b > 1) {
      throw new Error(`Invalid color input ${hex}`)
    }
    return new Color(r, g, b)
  }

  static fromCSSRgba(rgba: string) {
    const [r = 0, g = 0, b = 0, a = 1] = rgba
      .replace(/[^\d.,]/g, '')
      .split(',')
      .map((i) => {
        const float = parseFloat(i)
        return Number.isFinite(float) ? float : undefined
      })
    return new Color(r / 255, g / 255, b / 255, a)
  }

  constructor(
    public readonly r: number = 0,
    public readonly g: number = 0,
    public readonly b: number = 0,
    public readonly a: number = 1,
  ) {}

  withAlpha(a: number): Color {
    return new Color(this.r, this.g, this.b, a)
  }

  toCSS(): string {
    return `rgba(${(255 * this.r).toFixed()}, ${(255 * this.g).toFixed()}, ${(
      255 * this.b
    ).toFixed()}, ${this.a.toFixed(2)})`
  }
}
