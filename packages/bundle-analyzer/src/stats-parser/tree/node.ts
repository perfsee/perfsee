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

export class Node {
  name: string
  parent?: Node

  constructor(name: string, parent?: Node) {
    this.name = name
    this.parent = parent
  }

  get path() {
    const path = []
    let node: Node | undefined = this as Node

    while (node) {
      path.push(node.name)
      node = node.parent
    }

    return path.reverse().join('/')
  }

  get isRoot() {
    return !this.parent
  }
}
