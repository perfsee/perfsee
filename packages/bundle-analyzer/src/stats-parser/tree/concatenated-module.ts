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

import { Module } from './module'
import { Node } from './node'
import { ModuleData } from './types'

export class ConcatenatedModule extends Module {
  children: string[]

  constructor(name: string, data: ModuleData, parent?: Node) {
    super(name, data, parent)
    this.name += ' (concatenated)'
    this.children = []
    this.fillContentModules()
  }

  fillContentModules() {
    this.data.concatenating.forEach((moduleData) => this.addContentModule(moduleData))
  }

  addContentModule(moduleData: ModuleData) {
    this.children.push(moduleData.realPath)
  }

  toChartData() {
    return {
      ...super.toChartData(),
      concatenated: true,
      modules: this.children,
    }
  }
}
