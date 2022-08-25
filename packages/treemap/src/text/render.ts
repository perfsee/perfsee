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

import {
  BufferInfo,
  createBufferInfoFromArrays,
  createProgramInfo,
  createTexture,
  drawBufferInfo,
  ProgramInfo,
  setBuffersAndAttributes,
  setUniforms,
} from 'twgl.js'

import { AffineTransform, Rect, Vec2 } from '../math'

import metrics from './OpenSans-Regular.json'
import { sdfTextureImage } from './texture-base64'

const vs = `
attribute vec2 aPosition;
attribute vec2 aTexcoord;
attribute float aSize;

uniform mat3 uPositionToNDC;
uniform vec2 uTexSize;

varying vec2 vTexcoord;
varying float vSize;

void main() {
  vSize = aSize;
  vec2 NDCposition = (uPositionToNDC * vec3(aPosition, 1)).xy;
  gl_Position = vec4(NDCposition.xy, 1, 1);
  vTexcoord = aTexcoord / uTexSize;
}`

const fs = `
precision mediump float;

uniform mat3 uPositionToPhysical;
uniform sampler2D uTexture;
uniform float uBuffer;
uniform vec4 uColor;

varying vec2 vTexcoord;
varying float vSize;

void main() {
    float physicalSize = vSize * uPositionToPhysical[0][0];
    float s = physicalSize / 30.0 - 1.0;
    float gamma = max(0.0001, s * s * s * -1.0);
    float dist = texture2D(uTexture, vTexcoord).r;
    float alpha = smoothstep(uBuffer - gamma, uBuffer + gamma, dist);
    gl_FragColor = vec4(uColor.rgb, alpha * uColor.a);
}
`

interface TextBoxDraw {
  text: string
  rect: Rect
}

interface CharDraw {
  char: string
  rect: Rect
  size: number
}

export default class SDFTextRender {
  private sdfTexture: WebGLTexture = null!
  private readonly programInfo: ProgramInfo
  private bufferInfo?: BufferInfo
  private textureReady = false
  private textureSize: Vec2 = null!

  constructor(private readonly gl: WebGLRenderingContext) {
    this.programInfo = createProgramInfo(this.gl, [vs, fs])
  }

  loadTexture() {
    return new Promise<void>((resolve, reject) => {
      this.sdfTexture = createTexture(
        this.gl,
        {
          src: sdfTextureImage,
          mag: this.gl.LINEAR,
        },
        (err, _, source) => {
          if (err) {
            reject(err)
            return
          }
          const image = source instanceof Array ? source[0] : source
          this.textureSize = new Vec2(image.width, image.height)
          this.textureReady = true
          resolve()
        },
      )
    })
  }

  setTextBoxDraws(textBoxDraws: TextBoxDraw[]) {
    this.bufferInfo = createBufferInfoFromArrays(this.gl, this.createAttributeArray(this.measure(textBoxDraws)))
  }

  measure(textBoxDrawList: TextBoxDraw[]) {
    const r: CharDraw[] = []
    for (const textBoxDraw of textBoxDrawList) {
      const originHeight = (metrics.size + metrics.buffer * 2) * 1.1
      let originWidth = 0
      for (const char of textBoxDraw.text) {
        const metric = metrics.chars[char]
        if (!metric) continue
        originWidth += metric[4]
      }

      const scale = Math.min(textBoxDraw.rect.height() / originHeight, textBoxDraw.rect.width() / originWidth)

      const start = new Vec2(
        textBoxDraw.rect.left() + (textBoxDraw.rect.width() - originWidth * scale) / 2,
        textBoxDraw.rect.top() + (textBoxDraw.rect.height() - originHeight * scale) / 2,
      )

      r.push(...this.measureText(textBoxDraw.text, start, scale))
    }

    return r
  }

  measureText(text: string, start: Vec2, scale: number) {
    const drawList: CharDraw[] = []
    let current = start
    for (const char of text) {
      const charMeasure = this.measureChar(char, current, scale)
      if (!charMeasure) continue
      const { next, rect, size } = charMeasure
      current = next
      drawList.push({
        char,
        rect,
        size,
      })
    }

    return drawList
  }

  measureChar(char: string, start: Vec2, scale: number) {
    const metric = metrics.chars[char]

    if (!metric) return

    let width = metric[0]
    let height = metric[1]
    const horiBearingX = metric[2]
    const horiBearingY = metric[3]
    const horiAdvance = metric[4]

    width += metrics.buffer * 2
    height += metrics.buffer * 2

    const rect = new Rect(
      new Vec2(start.x + (horiBearingX - metrics.buffer) * scale, start.y + (metrics.size - horiBearingY) * scale),
      new Vec2(width * scale, height * scale),
    )

    return {
      rect,
      next: start.withX(start.x + horiAdvance * scale),
      size: metrics.size * scale,
    }
  }

  createAttributeArray(drawList: CharDraw[]) {
    const positionData = new Float32Array(drawList.length * 12)
    const texcoordData = new Float32Array(drawList.length * 12)
    const sizeData = new Float32Array(drawList.length * 12)
    for (let i = 0; i < drawList.length; i++) {
      const draw = drawList[i]
      const metric = metrics.chars[draw.char]
      const rect = draw.rect

      if (!metric) continue

      let width = metric[0]
      let height = metric[1]
      const posX = metric[5]
      const posY = metric[6]

      width += metrics.buffer * 2
      height += metrics.buffer * 2

      positionData[i * 12 + 0] = rect.left()
      positionData[i * 12 + 1] = rect.top()
      positionData[i * 12 + 2] = rect.right()
      positionData[i * 12 + 3] = rect.top()
      positionData[i * 12 + 4] = rect.left()
      positionData[i * 12 + 5] = rect.bottom()
      positionData[i * 12 + 6] = rect.right()
      positionData[i * 12 + 7] = rect.top()
      positionData[i * 12 + 8] = rect.left()
      positionData[i * 12 + 9] = rect.bottom()
      positionData[i * 12 + 10] = rect.right()
      positionData[i * 12 + 11] = rect.bottom()

      texcoordData[i * 12 + 0] = posX
      texcoordData[i * 12 + 1] = posY
      texcoordData[i * 12 + 2] = posX + width
      texcoordData[i * 12 + 3] = posY
      texcoordData[i * 12 + 4] = posX
      texcoordData[i * 12 + 5] = posY + height
      texcoordData[i * 12 + 6] = posX + width
      texcoordData[i * 12 + 7] = posY
      texcoordData[i * 12 + 8] = posX
      texcoordData[i * 12 + 9] = posY + height
      texcoordData[i * 12 + 10] = posX + width
      texcoordData[i * 12 + 11] = posY + height

      for (let x = 0; x < 6; x++) {
        sizeData[i * 6 + x] = draw.size
      }
    }

    const positionAttribute = {
      numComponents: 2,
      data: positionData,
    }

    const texcoordAttribute = {
      numComponents: 2,
      data: texcoordData,
    }

    const sizeAttribute = {
      numComponents: 1,
      data: sizeData,
    }

    return {
      aPosition: positionAttribute,
      aTexcoord: texcoordAttribute,
      aSize: sizeAttribute,
    }
  }

  draw(positionToNDC: AffineTransform, positionToPhysical: AffineTransform) {
    if (!this.textureReady || !this.bufferInfo) {
      return
    }

    const uniforms = {
      uColor: [0, 0, 0, 1],
      uBuffer: 192 / 256,
      uTexture: this.sdfTexture,
      uTexSize: [this.textureSize.x, this.textureSize.y],
      uPositionToNDC: positionToNDC.flatten(),
      uPositionToPhysical: positionToPhysical.flatten(),
    }

    this.gl.useProgram(this.programInfo.program)
    setBuffersAndAttributes(this.gl, this.programInfo, this.bufferInfo)
    setUniforms(this.programInfo, uniforms)
    drawBufferInfo(this.gl, this.bufferInfo)
  }
}
