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

import { resolve, join, sep, parse } from 'path'

import { rootPath } from './consts'
import { isDirectory, isFile } from './fs'

export function pathToRoot(...paths: string[]) {
  return join(rootPath, ...paths)
}

export const nodeModulesPath = pathToRoot('node_modules')
export const packageJsonPath = pathToRoot('package.json')
export const distPath = pathToRoot('dist')

export const isRelativePath = (path: string) => {
  return path.startsWith('.' + sep) || path.startsWith('..' + sep)
}

export const getImportedFileName = (
  from: string,
  to: string,
  extensions: string[] = ['.js', '.jsx', '.ts', '.tsx'],
) => {
  let realFilePath: string | undefined
  const filePath = resolve(parse(from).dir, to)
  const parsed = parse(filePath)
  if (parsed.ext && extensions.includes(parsed.ext) && isFile(filePath)) {
    realFilePath = filePath
  } else {
    if (isDirectory(filePath)) {
      realFilePath = extensions.map((ext) => `${filePath}/index${ext}`).find((file) => isFile(file))
    } else {
      realFilePath = extensions.map((ext) => `${filePath}${ext}`).find((file) => isFile(file))
    }
  }

  return realFilePath
}
