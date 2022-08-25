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

import { last } from 'lodash'

import { BaseFolder } from './base-folder'
import { ConcatenatedModule } from './concatenated-module'
import { Module } from './module'
import { ModuleData } from './types'
import { getModulePathParts } from './utils'

export class Folder extends BaseFolder {
  get gzipSize() {
    return this.size ? this.size.gzip : 0
  }

  get brSize() {
    return this.size ? this.size.brotli : 0
  }

  addModule(moduleData: ModuleData) {
    const pathParts = getModulePathParts(moduleData.realPath)

    if (!pathParts) {
      return
    }

    const [folders, fileName] = [pathParts.slice(0, -1), last(pathParts)]
    let currentFolder: Folder = this

    folders.forEach((folderName) => {
      let childNode = currentFolder.getChild(folderName)

      if (
        // Folder is not created yet
        !childNode ||
        // In some situations (invalid usage of dynamic `require()`) webpack generates a module with empty require
        // context, but it's moduleId points to a directory in filesystem.
        // In this case we replace this `File` node with `Folder`.
        // See `test/stats/with-invalid-dynamic-require.json` as an example.
        !(childNode instanceof Folder)
      ) {
        childNode = currentFolder.addChildFolder(new Folder(folderName))
      }

      currentFolder = childNode as Folder
    })

    const ModuleConstructor = moduleData.concatenating.length ? ConcatenatedModule : Module
    const module = new ModuleConstructor(fileName!, moduleData, this)
    currentFolder.addChildModule(module)
  }

  toChartData() {
    return {
      ...super.toChartData(),
      gzip: this.gzipSize,
      brotli: this.brSize,
    }
  }
}
