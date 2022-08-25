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

export function getModulePathParts(moduleName: string) {
  // Removing loaders from module path: they're joined by `!` and the last part is a raw module path
  const realPath = last(moduleName.split('!'))

  if (!realPath) {
    return null
  }

  // Splitting module path into parts
  // Removing first `.`
  const pathParts = realPath.split('/').slice(1)

  // Replacing `~` with `node_modules`
  pathParts.forEach((part, i) => {
    pathParts[i] = part === '~' ? 'node_modules' : part
  })

  return pathParts.length ? pathParts : null
}
