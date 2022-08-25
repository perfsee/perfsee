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
  drawBufferInfo,
  ProgramInfo,
  setBuffersAndAttributes,
  setUniforms,
} from 'twgl.js'

import { Color } from '../color'
import { AffineTransform, Rect } from '../math'

const vs = `
attribute vec2 aPosition;
attribute vec2 aSize;
attribute vec2 aLocal;
attribute vec3 aColor;
attribute float aIndex;
attribute float aHighlight;
attribute float aActive;
varying vec3 vColor;
varying float vIndex;
varying vec2 vPosition;
varying vec2 vLocal;
varying vec2 vSize;
varying float vHighlight;
varying float vActive;

uniform mat3 uPositionToNDC;

void main() {
  vColor = aColor;
  vIndex = aIndex;
  vPosition = aPosition;
  vLocal = aLocal;
  vSize = aSize;
  vHighlight = aHighlight;
  vActive = aActive;
  vec2 NDCposition = (uPositionToNDC * vec3(aPosition, 1)).xy;
  gl_Position = vec4(NDCposition.xy, 1, 1);
}`

const fs = `
precision mediump float;

uniform float uRadius;
uniform float uHoverIndex;
varying vec3 vColor;
varying float vIndex;
varying vec2 vPosition;
varying vec2 vLocal;
varying vec2 vSize;
varying float vHighlight;
varying float vActive;

uniform mat3 uPositionToPhysical;

vec3 highlightColor = vec3(0.93,0.27,0.18);
vec4 activeColor = vec4(1.0, 0.0, 0.0, 0.6);

void main() {
  vec2 physicalPosition = (uPositionToPhysical * vec3(vPosition, 1)).xy;
  vec2 physicalLocal = (uPositionToPhysical * vec3(vPosition + vLocal, 1)).xy - physicalPosition.xy;
  bool inHighlight = vHighlight < 0.001 ? vLocal.x / vSize.x > 1.0 - vHighlight * -1.0 : vLocal.x / vSize.x > vHighlight;
  bool highlight = inHighlight && mod(physicalPosition.x + physicalPosition.y, 10.0) <= 5.0;
  vec3 rectColor = vActive < 0.001 ? vColor.rgb : activeColor.rgb * activeColor.a + vColor.rgb * (1.0 - activeColor.a);
  vec3 highlightedColor = highlight ? highlightColor.rgb * 0.5 + rectColor.rgb * 0.5 : rectColor.rgb;
  bool inBorder = physicalLocal.x < 5.0 || physicalLocal.y < 5.0;

  if (inBorder) {
    gl_FragColor = vec4( 0.0, 0.0, 0.0, 0.0 );
  } else if (uHoverIndex == vIndex) {
    gl_FragColor = vec4( highlightedColor.rgb * 1.3, 1 );
  } else {
    gl_FragColor = vec4( highlightedColor.rgb, 1 );
  }
}`

const colorToRGBAttribute = (colorList: Color[]) => {
  const data = new Float32Array(colorList.length * 18)
  for (let i = 0; i < colorList.length; i++) {
    const color = colorList[i]
    for (let x = 0; x < 6; x++) {
      data[i * 18 + x * 3 + 0] = color.r
      data[i * 18 + x * 3 + 1] = color.g
      data[i * 18 + x * 3 + 2] = color.b
    }
  }
  return {
    numComponents: 3,
    data,
  }
}

const positionAttribute = (rectList: Rect[]) => {
  const data = new Float32Array(rectList.length * 12)
  for (let i = 0; i < rectList.length; i++) {
    const rect = rectList[i]
    data[i * 12 + 0] = rect.left()
    data[i * 12 + 1] = rect.bottom()
    data[i * 12 + 2] = rect.right()
    data[i * 12 + 3] = rect.bottom()
    data[i * 12 + 4] = rect.right()
    data[i * 12 + 5] = rect.top()
    data[i * 12 + 6] = rect.right()
    data[i * 12 + 7] = rect.top()
    data[i * 12 + 8] = rect.left()
    data[i * 12 + 9] = rect.top()
    data[i * 12 + 10] = rect.left()
    data[i * 12 + 11] = rect.bottom()
  }
  return {
    numComponents: 2,
    data,
  }
}

const localAttribute = (rectList: Rect[]) => {
  const data = new Float32Array(rectList.length * 12)
  for (let i = 0; i < rectList.length; i++) {
    const rect = rectList[i]
    data[i * 12 + 0] = 0
    data[i * 12 + 1] = rect.height()
    data[i * 12 + 2] = rect.width()
    data[i * 12 + 3] = rect.height()
    data[i * 12 + 4] = rect.width()
    data[i * 12 + 5] = 0
    data[i * 12 + 6] = rect.width()
    data[i * 12 + 7] = 0
    data[i * 12 + 8] = 0
    data[i * 12 + 9] = 0
    data[i * 12 + 10] = 0
    data[i * 12 + 11] = rect.height()
  }
  return {
    numComponents: 2,
    data,
  }
}

const sizeAttribute = (rectList: Rect[]) => {
  const data = new Float32Array(rectList.length * 12)
  for (let i = 0; i < rectList.length; i++) {
    const rect = rectList[i]
    for (let x = 0; x < 6; x++) {
      data[i * 12 + x * 2 + 0] = rect.width()
      data[i * 12 + x * 2 + 1] = rect.height()
    }
  }
  return {
    numComponents: 2,
    data,
  }
}

const indexAttribute = (indexList: number[]) => {
  const data = new Float32Array(indexList.length * 6)
  for (let i = 0; i < indexList.length; i++) {
    const index = indexList[i]
    data[i * 6 + 0] = index
    data[i * 6 + 1] = index
    data[i * 6 + 2] = index
    data[i * 6 + 3] = index
    data[i * 6 + 4] = index
    data[i * 6 + 5] = index
  }
  return {
    numComponents: 1,
    data,
  }
}

const highlightAttribute = (highlightList: number[]) => {
  const data = new Float32Array(highlightList.length * 6)
  for (let i = 0; i < highlightList.length; i++) {
    const index = highlightList[i]
    data[i * 6 + 0] = index
    data[i * 6 + 1] = index
    data[i * 6 + 2] = index
    data[i * 6 + 3] = index
    data[i * 6 + 4] = index
    data[i * 6 + 5] = index
  }
  return {
    numComponents: 1,
    data,
  }
}

const activeAttribute = (activeList: boolean[]) => {
  const data = new Float32Array(activeList.length * 6)
  for (let i = 0; i < activeList.length; i++) {
    const v = activeList[i] ? 1 : 0
    data[i * 6 + 0] = v
    data[i * 6 + 1] = v
    data[i * 6 + 2] = v
    data[i * 6 + 3] = v
    data[i * 6 + 4] = v
    data[i * 6 + 5] = v
  }
  return {
    numComponents: 1,
    data,
  }
}

export default class BoxRender {
  private readonly programInfo: ProgramInfo

  private rectBufferInfo?: BufferInfo
  private colorBufferInfo?: BufferInfo
  private highlightBufferInfo?: BufferInfo
  private indexBufferInfo?: BufferInfo
  private activeBufferInfo?: BufferInfo

  constructor(private readonly gl: WebGLRenderingContext) {
    this.programInfo = createProgramInfo(this.gl, [vs, fs])
  }

  setRect(rectList: Rect[]) {
    this.rectBufferInfo = createBufferInfoFromArrays(this.gl, {
      aPosition: positionAttribute(rectList),
      aSize: sizeAttribute(rectList),
      aLocal: localAttribute(rectList),
    })
  }

  setColor(colorList: Color[]) {
    this.colorBufferInfo = createBufferInfoFromArrays(this.gl, {
      aColor: colorToRGBAttribute(colorList),
    })
  }

  setHighlight(highlightList: number[]) {
    this.highlightBufferInfo = createBufferInfoFromArrays(this.gl, {
      aHighlight: highlightAttribute(highlightList),
    })
  }

  setIndex(indexList: number[]) {
    this.indexBufferInfo = createBufferInfoFromArrays(this.gl, {
      aIndex: indexAttribute(indexList),
    })
  }

  setActive(activeList: boolean[]) {
    this.activeBufferInfo = createBufferInfoFromArrays(this.gl, {
      aActive: activeAttribute(activeList),
    })
  }

  draw(positionToNDC: AffineTransform, positionToPhysical: AffineTransform, hoverIndex: number) {
    if (
      !(
        this.rectBufferInfo &&
        this.colorBufferInfo &&
        this.highlightBufferInfo &&
        this.indexBufferInfo &&
        this.activeBufferInfo
      )
    ) {
      return
    }

    const uniforms = {
      uPositionToNDC: positionToNDC.flatten(),
      uHoverIndex: hoverIndex,
      uPositionToPhysical: positionToPhysical.flatten(),
    }

    this.gl.useProgram(this.programInfo.program)
    setBuffersAndAttributes(this.gl, this.programInfo, this.rectBufferInfo)
    setBuffersAndAttributes(this.gl, this.programInfo, this.colorBufferInfo)
    setBuffersAndAttributes(this.gl, this.programInfo, this.highlightBufferInfo)
    setBuffersAndAttributes(this.gl, this.programInfo, this.indexBufferInfo)
    setBuffersAndAttributes(this.gl, this.programInfo, this.activeBufferInfo)
    setUniforms(this.programInfo, uniforms)
    drawBufferInfo(this.gl, this.rectBufferInfo)
  }
}
