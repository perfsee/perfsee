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

import fs, { promises } from 'fs'
import path from 'path'

import { format, BuiltInParserName } from 'prettier'

import { pathToRoot } from './path'

const { prettier: prettierConfig } = require(pathToRoot('package.json'))

export const readdir = promises.readdir
export const writeFileAsync = promises.writeFile
export const exists = fs.existsSync

export function isFile(file: string) {
  return fs.existsSync(file) && fs.statSync(file).isFile()
}

export function isDirectory(dir: string) {
  return fs.existsSync(dir) && fs.statSync(dir).isDirectory()
}

export async function visitRecursively(
  fileOrFolder: string,
  visitor: (path: string) => void | Promise<void>,
  options: { filter?: (path: string) => boolean },
) {
  if (isDirectory(fileOrFolder)) {
    const children = await readdir(fileOrFolder)
    await Promise.all(children.map((child) => visitRecursively(path.join(fileOrFolder, child), visitor, options)))
  } else if (isFile(fileOrFolder)) {
    const shouldVisit = !options.filter || options.filter(fileOrFolder)
    if (!shouldVisit) {
      return
    }

    return visitor(fileOrFolder) || Promise.resolve()
  } else {
    throw new Error(`path ${fileOrFolder} does not exist!`)
  }
}

export async function getFileContent(file: string): Promise<string> {
  return promises.readFile(file, { encoding: 'utf8' })
}

export function prettier(content: string, parser: BuiltInParserName = 'typescript') {
  return format(content, { ...prettierConfig, parser })
}
