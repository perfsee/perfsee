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

import fs from 'fs'
import { join } from 'path'

import { readJSONFile, resolveNodeModulePath } from '@perfsee/bundle-analyzer'

export function getAllPackagesVersions(
  repoPath: string,
  modules: Map<string, [version: string, sideEffects?: boolean | string[] | 'implicitly']>,
) {
  const versions = []
  for (const [fullpath, [version, sideEffects = 'implicitly']] of modules) {
    // cut path
    const modulePath = resolveNodeModulePath(fullpath, repoPath)
    if (modulePath) {
      versions.push({ name: modulePath.dependentPath, version, sideEffects })
    }
  }

  return versions
}

export function resolveModuleVersion(path: string, rootPath: string) {
  const modulePath = resolveNodeModulePath(path, rootPath)

  if (modulePath) {
    const packageJsonPath = join(modulePath.path, 'package.json')
    if (fs.existsSync(packageJsonPath) && fs.statSync(packageJsonPath).isFile()) {
      const packageJsonData = readJSONFile<any>(packageJsonPath)
      if (typeof packageJsonData.name === 'string' && typeof packageJsonData.version === 'string') {
        return [
          modulePath.dependentPath,
          packageJsonData.version as string,
          packageJsonData.sideEffects ?? 'implicitly',
        ] as const
      }
    }
  }
}
