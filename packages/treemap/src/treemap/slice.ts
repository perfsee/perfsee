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

export default function (parent: HierarchyRectangularNode<unknown>, x0: number, y0: number, x1: number, y1: number) {
  const nodes = parent.children
  if (!nodes) return
  let node
  let i = -1
  const n = nodes.length
  const k = parent.value && (y1 - y0) / parent.value

  while (++i < n) {
    node = nodes[i]
    node.x0 = x0
    node.x1 = x1
    node.y0 = y0
    node.y1 = y0 += node.value! * k!
  }
}
