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

import { addSize } from '../../utils'

import { Node } from './node'
import { ModuleData } from './types'

export class Module extends Node {
  data: ModuleData

  constructor(name: string, data: ModuleData, parent?: Node) {
    super(name, parent)
    this.data = data
  }

  get size() {
    return this.data.size
  }

  set size(value) {
    this.data.size = value
  }

  mergeData(data: ModuleData) {
    if (data.size) {
      this.size = addSize(this.size, data.size)
    }
  }

  toChartData() {
    return {
      name: this.name,
      value: this.size.raw,
      gzip: this.size.gzip,
      brotli: this.size.brotli,
      unused: this.data.esm
        ? this.data.treeShaking?.sideEffects?.length
          ? this.data.treeShaking.unused?.length
          : undefined
        : undefined,
      dynamic: this.data.dynamic || undefined,
      esm: this.data.esm ? undefined : false,
      sideEffects: this.data.treeShaking?.markedSideEffects ? true : undefined,
    }
  }
}
