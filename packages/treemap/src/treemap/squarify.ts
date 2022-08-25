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

import { HierarchyRectangularNode } from 'd3-hierarchy'

import treemapDice from './dice'
import treemapSlice from './slice'

export const phi = (1 + Math.sqrt(5)) / 2

export function squarifyRatio(
  ratio: number,
  parent: HierarchyRectangularNode<unknown>,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
) {
  const nodes = parent.children
  if (!nodes) {
    return
  }
  const rows = [],
    n = nodes.length
  let row,
    nodeValue,
    i0 = 0,
    i1 = 0,
    dx,
    dy,
    value = parent.value!,
    sumValue,
    minValue,
    maxValue,
    newRatio,
    minRatio,
    alpha,
    beta

  while (i0 < n) {
    dx = x1 - x0
    dy = y1 - y0

    // Find the next non-empty node.
    do sumValue = nodes[i1++].value!
    while (!sumValue && i1 < n)
    minValue = maxValue = sumValue
    alpha = Math.max(dy / dx, dx / dy) / (value * ratio)
    beta = sumValue * sumValue * alpha
    minRatio = Math.max(maxValue / beta, beta / minValue)

    // Keep adding nodes while the aspect ratio maintains or improves.
    for (; i1 < n; ++i1) {
      sumValue += nodeValue = nodes[i1].value!
      if (nodeValue < minValue) minValue = nodeValue
      if (nodeValue > maxValue) maxValue = nodeValue
      beta = sumValue * sumValue * alpha
      newRatio = Math.max(maxValue / beta, beta / minValue)
      if (newRatio > minRatio) {
        sumValue -= nodeValue
        break
      }
      minRatio = newRatio
    }

    // Position and record the row orientation.
    rows.push((row = { value: sumValue, dice: dx < dy, children: nodes.slice(i0, i1) }))
    if (row.dice) treemapDice(row as any, x0, y0, x1, value ? (y0 += (dy * sumValue) / value) : y1)
    else treemapSlice(row as any, x0, y0, value ? (x0 += (dx * sumValue) / value) : x1, y1)
    value -= sumValue
    i0 = i1
  }

  return rows
}

export default (function custom(ratio) {
  function squarify(parent: HierarchyRectangularNode<unknown>, x0: number, y0: number, x1: number, y1: number) {
    squarifyRatio(ratio, parent, x0, y0, x1, y1)
  }

  squarify.ratio = function (x: number) {
    return custom(x > 1 ? x : 1)
  }

  return squarify
})(phi)
