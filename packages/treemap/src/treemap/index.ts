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

import { HierarchyNode, HierarchyRectangularNode, treemap } from 'd3-hierarchy'

import { Color } from '../color'
import { AffineTransform, Rect, Vec2 } from '../math'

import tileSquarify from './squarify'

export interface TreeMapRect<TData> {
  rect: Rect
  color: Color
  name: any
  index: number
  hasChild: boolean
  highlight: number
  data: TData
}

export type TreeMapData = {
  name: string
  color?: string
  highlight?: number
  __tree_map_id__?: number
  __tree_map_cluster__?: number
}

// https://stackoverflow.com/questions/42623071/maximum-call-stack-size-exceeded-with-math-min-and-math-max
function max(arr: number[]) {
  return arr.reduce((pre, curr) => (pre > curr ? pre : curr), -Infinity)
}

function createColorScale(nodes: HierarchyRectangularNode<TreeMapData>[]) {
  const clusterSizes: number[] = []
  for (const node of nodes) {
    clusterSizes[node.data.__tree_map_cluster__!] = Math.max(
      clusterSizes[node.data.__tree_map_cluster__!] ?? -Infinity,
      node.value!,
    )
  }
  const clusterTotalSize = clusterSizes.reduce((pre, curr) => pre + (curr ?? 0), 0)

  const maxDepth = Math.max(max(nodes.map((node) => node.depth)), 1)
  return (cluster: number) => {
    const hueOffset = Math.pow(
      clusterSizes.slice(0, cluster).reduce((pre, curr) => pre + (curr ?? 0), 0) / clusterTotalSize,
      3,
    )
    const hue = (hueOffset * 201 + 40) % 360
    const color1 = Color.fromLumaChromaHue(0.9, 0.2, hue)
    const color2 = Color.fromLumaChromaHue(0.5, 0.7, hue)
    const [rs, gs, bs] = [color2.r - color1.r, color2.g - color1.g, color2.b - color1.b]
    return (depth: number) => {
      const s = 1 - depth / maxDepth
      const [r, g, b] = [rs * s + color1.r, gs * s + color1.r, bs * s + color1.r]
      return new Color(r, g, b, 1)
    }
  }
}

export class TreeMapController<TData extends TreeMapData> {
  rects: TreeMapRect<TData>[] = null!
  rootNode: HierarchyRectangularNode<TData>
  descendantNodes: HierarchyRectangularNode<TData>[]
  colorScale: ReturnType<typeof createColorScale>
  size: Vec2 = null!
  sizeTransform: AffineTransform = null!

  constructor(data: HierarchyNode<TData>, private readonly initialSize: Vec2, private readonly skipRoot: boolean) {
    let index = 0
    const indexedData = data.each((node) => (node.data.__tree_map_id__ = index++))
    this.rootNode = treemap<TData>()
      .tile(tileSquarify)
      .size([initialSize.x, initialSize.y])
      .paddingInner(0)
      .paddingTop(({ y0, y1 }) => (y1 - y0) * 0.07)
      .paddingBottom(({ y0, y1 }) => (y1 - y0) * 0.02)
      .paddingLeft(({ y0, y1 }) => (y1 - y0) * 0.02)
      .paddingRight(({ y0, y1 }) => (y1 - y0) * 0.02)(indexedData)
    const clusters = skipRoot && this.rootNode.children ? this.rootNode.children.map((node) => node) : [this.rootNode]
    clusters.forEach((cluster, index) => {
      cluster.each((node) => (node.data.__tree_map_cluster__ = index))
    })
    this.descendantNodes = clusters.flatMap((cluster) => cluster.descendants())
    this.colorScale = createColorScale(this.descendantNodes)
  }

  setSize(size: Vec2) {
    this.size = size
    this.sizeTransform = AffineTransform.betweenRects(new Rect(Vec2.zero, this.initialSize), new Rect(Vec2.zero, size))
    this.rects = this.descendantNodes.map((node) => this.nodeToTreeMapRect(node))
  }

  nodeToTreeMapRect(node: HierarchyRectangularNode<TData>): TreeMapRect<TData> {
    return {
      rect: this.sizeTransform.transformRect(
        new Rect(new Vec2(node.x0, node.y0), new Vec2(node.x1 - node.x0, node.y1 - node.y0)),
      ),
      color: node.data.color
        ? Color.fromCSSHex(node.data.color)
        : this.colorScale(node.data.__tree_map_cluster__!)(node.depth),
      highlight: node.data.highlight ?? 0,
      name: node.data.name,
      index: node.data.__tree_map_id__!,
      data: node.data,
      hasChild: node.children ? node.children.length > 0 : false,
    }
  }

  findNodeByPosition(position: Vec2, node: HierarchyRectangularNode<TData> = this.rootNode): TreeMapRect<TData> | null {
    const nodeRect = this.sizeTransform.transformRect(
      new Rect(new Vec2(node.x0, node.y0), new Vec2(node.x1 - node.x0, node.y1 - node.y0)),
    )
    if (
      nodeRect.left() < position.x &&
      nodeRect.right() > position.x &&
      nodeRect.top() < position.y &&
      nodeRect.bottom() > position.y
    ) {
      if (node.children) {
        for (const child of node.children) {
          const result = this.findNodeByPosition(position, child)
          if (result) {
            return result
          }
        }
      }

      if (!this.skipRoot || node !== this.rootNode) {
        return this.nodeToTreeMapRect(node)
      } else {
        return null
      }
    } else {
      return null
    }
  }
}
