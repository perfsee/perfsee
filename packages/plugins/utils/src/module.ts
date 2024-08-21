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
import { dirname, join, resolve } from 'path'

import { readJSONFile, resolveNodeModulePath } from '@perfsee/bundle-analyzer'

export const catchModuleVersionFromRequest = (
  request: any,
  modules: Map<string, [version: string, sideEffects?: boolean | string[]]>,
  buildPath: string,
  repoPath: string,
) => {
  try {
    if (typeof request.path === 'string') {
      // In some cases, the description file not the expected package.json
      // for example when resolving '@babel/runtime/helpers/esm/inheritsLoose.js', the description file comes from 'node_modules/@babel/runtime/helpers/esm/package.json'
      // we need to re-resolve to find the description file with version from 'node_modules/@babel/runtime/package.json'
      const modulePath = resolveNodeModulePath(resolve(buildPath, request.path), repoPath)
      const packageJsonPath = modulePath ? join(modulePath.path, 'package.json') : undefined

      if (
        typeof request.descriptionFilePath === 'string' &&
        typeof request.descriptionFileData === 'object' &&
        typeof request.descriptionFileData.version === 'string' &&
        // If the description file path does not match the expected package.json path, skip
        (!packageJsonPath || request.descriptionFilePath === packageJsonPath)
      ) {
        if (request.descriptionFileData.name === 'webpack') {
          // skip webpack built-in modules
          return
        }

        const moduleDirname = dirname(request.descriptionFilePath)

        if (!modules.has(moduleDirname)) {
          modules.set(moduleDirname, [
            request.descriptionFileData.version,
            request.descriptionFileData.sideEffects ?? 'implicitly',
          ])
        }

        return
      }

      if (packageJsonPath && fs.existsSync(packageJsonPath) && fs.statSync(packageJsonPath).isFile()) {
        const packageJsonData = readJSONFile<any>(packageJsonPath)
        if (typeof packageJsonData.name === 'string' && typeof packageJsonData.version === 'string') {
          const moduleDirname = dirname(packageJsonPath)

          if (!modules.has(moduleDirname)) {
            modules.set(moduleDirname, [packageJsonData.version, packageJsonData.sideEffects ?? 'implicitly'])
          }
        }
      }
    }
  } catch (e) {
    console.error('failed when catching modules version: ', e)
  }
}
