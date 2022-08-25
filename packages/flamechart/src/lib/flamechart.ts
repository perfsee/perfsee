import {Frame, CallTreeNode} from './profile'

import { lastOf } from './utils'
import { clamp, Rect, Vec2 } from './math'
import { ProfileSearchEngine } from './profile-search'

export interface FlamechartFrame {
  node: CallTreeNode
  start: number
  end: number
  parent: FlamechartFrame | null
  children: FlamechartFrame[]
  depth: number
}

type StackLayer = FlamechartFrame[]

interface FlamechartForeachDataSource {
  maxValue: number

  minValue: number

  formatValue(v: number): string

  forEachCall(
    openFrame: (node: CallTreeNode, value: number) => void,
    closeFrame: (node: CallTreeNode, value: number) => void,
  ): void

  getColorBucketForFrame(f: Frame): number
}

export type RootFilter = (node: CallTreeNode) => boolean

export function buildFlamechart(source: FlamechartForeachDataSource, rootFilter?: RootFilter) {
  const layers: StackLayer[] = []
  const stack: FlamechartFrame[] = []
  const openFrame = (node: CallTreeNode, value: number) => {
    if (rootFilter && !rootFilter(node) && !stack.length) {
      return
    }
    const parent = lastOf(stack)
    const frame: FlamechartFrame = {
      node,
      parent,
      children: [],
      start: value,
      end: value,
      depth: stack.length
    }
    if (parent) {
      parent.children.push(frame)
    }
    stack.push(frame)
  }

  let minFrameWidth = Infinity
  const closeFrame = (_: CallTreeNode, value: number) => {
    if (stack.length < 1) return
    const stackTop = stack.pop()!
    stackTop.end = value
    if (stackTop.end - stackTop.start === 0) return
    const layerIndex = stack.length
    while (layers.length <= layerIndex) layers.push([])
    layers[layerIndex].push(stackTop)
    minFrameWidth = Math.min(minFrameWidth, stackTop.end - stackTop.start)
  }

  const maxValue = source.maxValue
  const minValue = source.minValue
  source.forEachCall(openFrame, closeFrame)

  if (!isFinite(minFrameWidth)) minFrameWidth = 1

  return new Flamechart(layers, minValue, maxValue, minFrameWidth, source.getColorBucketForFrame, source.formatValue)
}

export function buildNonStackFlamechart(source: FlamechartForeachDataSource, rootFilter?: RootFilter) {
  const layers: StackLayer[] = []
  const stack: FlamechartFrame[] = []
  const openFrame = (node: CallTreeNode, value: number) => {
    if (rootFilter && !rootFilter(node)) {
      return
    }
    while (stack.length) {
      const parent = lastOf(stack)!
      if (parent.end < value) {
        stack.pop()
      } else {
        break
      }
    }

    const parent = lastOf(stack)
    const frame: FlamechartFrame = {
      node,
      parent,
      children: [],
      start: value,
      end: Infinity,
      depth: stack.length
    }
    stack.push(frame)
  }

  let minFrameWidth = Infinity
  const closeFrame = (node: CallTreeNode, value: number) => {
    if (rootFilter && !rootFilter(node)) {
      return
    }
    console.assert(stack.length > 0)

    const closeFrameIndex = stack.findIndex((frame) => frame.node === node);
    console.assert(closeFrameIndex !== -1);

    const closeFrame = stack[closeFrameIndex]
    closeFrame.end = value

    while (layers.length <= closeFrameIndex) layers.push([])
    layers[closeFrameIndex].push(closeFrame)
    minFrameWidth = Math.min(minFrameWidth, closeFrame.end - closeFrame.start)
  }

  const maxValue = source.maxValue
  const minValue = source.minValue
  source.forEachCall(openFrame, closeFrame)

  if (!isFinite(minFrameWidth)) minFrameWidth = 1

  return new Flamechart(layers, minValue, maxValue, minFrameWidth, source.getColorBucketForFrame, source.formatValue)
}

export function buildFlamechartWithProcessor(source: FlamechartForeachDataSource, processor: (node: CallTreeNode) => {level: number, start: number, end: number}, rootFilter?: RootFilter) {
  const layers: StackLayer[] = []
  let minFrameWidth = Infinity
  const openFrame = (node: CallTreeNode) => {
    if (rootFilter && !rootFilter(node)) {
      return
    }
    const info = processor(node)

    const frame: FlamechartFrame = {
      node,
      parent: null,
      children: [],
      start: info.start,
      end: info.end,
      depth: info.level
    }
    while (layers.length <= info.level) layers.push([])
    layers[info.level].push(frame)
    minFrameWidth = Math.min(minFrameWidth, frame.end - frame.start)
  }

  const maxValue = source.maxValue
  const minValue = source.minValue
  source.forEachCall(openFrame, (_, __) => {})

  if (!isFinite(minFrameWidth)) minFrameWidth = 1

  return new Flamechart(layers, minValue, maxValue, minFrameWidth, source.getColorBucketForFrame, source.formatValue)
}

export class Flamechart {
  getTotalWeight() {
    return this.maxValue - this.minValue
  }
  getMinValue() {
    return this.minValue
  }
  getMaxValue() {
    return this.maxValue
  }
  getLayers() {
    return this.layers
  }
  getMinFrameWidth() {
    return this.minFrameWidth
  }
  getFrame(node: CallTreeNode) {
    for (const layer of this.layers) {
      for (const frame of layer) {
        if (node === frame.node) {
          return frame
        }
      }
    }
    return null
  }

  getClampedViewportWidth(viewportWidth: number) {
    const maxWidth = this.getTotalWeight()

    // In order to avoid floating point error, we cap the maximum zoom. In
    // particular, it's important that at the maximum zoom level, the total
    // trace size + a viewport width is not equal to the trace size due to
    // floating point rounding.
    //
    // For instance, if the profile's total weight is 2^60, and the viewport
    // size is 1, trying to move one viewport width right will result in no
    // change because 2^60 + 1 = 2^60 in floating point arithmetic. JavaScript
    // numbers are 64 bit floats, and therefore have 53 mantissa bits. You can
    // see this for yourself in the console. Try:
    //
    //   > Math.pow(2, 60) + 1 === Math.pow(2, 60)
    //   true
    //   > Math.pow(2, 53) + 1 === Math.pow(2, 53)
    //   true
    //   > Math.pow(2, 52) + 1 === Math.pow(2, 52)
    //   false
    //
    // We use 2^40 as a cap instead, since we want to be able to make small
    // adjustments within a viewport width.
    //
    // For reference, this will still allow you to zoom until 1 nanosecond fills
    // the screen in a profile with a duration of over 18 minutes.
    //
    //   > Math.pow(2, 40) / (60 * Math.pow(10, 9))
    //   18.325193796266667
    //
    const maxZoom = Math.pow(2, 40)

    // In addition to capping zoom to avoid floating point error, we further cap
    // zoom to avoid letting you zoom in so that the smallest element more than
    // fills the screen, since that probably isn't useful. The final zoom cap is
    // determined by the minimum zoom of either 2^40x zoom or the necessary zoom
    // for the smallest frame to fill the screen three times.
    const minWidth = clamp(3 * this.getMinFrameWidth(), maxWidth / maxZoom, maxWidth)

    return clamp(viewportWidth, minWidth, maxWidth)
  }

  // Given a desired config-space viewport rectangle, clamp the rectangle so
  // that it fits within the given flamechart. This prevents the viewport from
  // extending past the bounds of the flamechart or zooming in too far.
  getClampedConfigSpaceViewportRect({
    configSpaceViewportRect,
    renderInverted,
  }: {
    configSpaceViewportRect: Rect
    renderInverted?: boolean
  }) {
    const configSpaceSize = new Vec2(this.getTotalWeight(), this.getLayers().length)
    const width = this.getClampedViewportWidth(configSpaceViewportRect.size.x)
    const size = configSpaceViewportRect.size.withX(width)
    const origin = Vec2.clamp(
      configSpaceViewportRect.origin,
      new Vec2(0, renderInverted ? 0 : -1),
      Vec2.max(Vec2.zero, configSpaceSize.minus(size).plus(new Vec2(0, 1))),
    )
    return new Rect(origin, configSpaceViewportRect.size.withX(width))
  }

  search(searchResults: ProfileSearchEngine) {
    const matchFrames: FlamechartFrame[] = []

    let highestScore = -Infinity
    let highestScoreFrame: FlamechartFrame | undefined = undefined

    this.getLayers().forEach((layer) => {
      layer.forEach((frame) => {
        const match = searchResults!.getMatchForNode(frame.node)

        if (match) {
          matchFrames.push(frame)

          if (match.score > highestScore) {
            highestScore = match.score
            highestScoreFrame = frame
          }
        }
      })
    })

    return {
      matchFrames,
      highestScoreFrame
    }
  }

  constructor(
    private layers: StackLayer[] = [],
    private minValue: number = 0,
    private maxValue: number = 0,
    private minFrameWidth: number = 1,
    public getColorBucketForFrame: (frame: Frame) => number,
    public formatValue: (v: number) => string
  ) {
  }
}
