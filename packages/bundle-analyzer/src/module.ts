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

import { win32, posix } from 'path'

import { parse as parseQueryString } from 'query-string'

import { SOURCE_CODE_PATH, WEBPACK_INTERNAL_PATH } from './stats'
import { PackageMeta } from './stats-parser/types'

export function trimModuleName(raw: string): string {
  let nameCandidate = ''
  let isMultiModule = false
  let isInBracket = false
  let isInQueryString = false

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    const nextCh = raw[i + 1]

    // multi ./path/to/module1 ./path/to/module2
    if (nameCandidate === 'multi' && ch === ' ') {
      isMultiModule = true
      nameCandidate = ''
    } else if (isInBracket) {
      if (ch === ')') {
        isInBracket = false
      }
      continue
    }

    // /path/to/loader!/path/to/loader!./path/to/module
    if (ch === '!') {
      nameCandidate = ''
      isInQueryString = false
    } else if (ch === '?') {
      isInQueryString = true
      // ./next-client-pages-loader.js?page=./entry.js
      const page = parseQueryString(raw.substr(i + 1)).page
      if (page) {
        nameCandidate = page as string
        break
      }
    } else if (ch === ' ') {
      if (isMultiModule) {
        if (nextCh) {
          nameCandidate = ''
        } else {
          break
        }
      } else if (nextCh === '(') {
        // ./path/to/module (ignored)
        isInBracket = true
      } else {
        // ./path/to/module sync ^\\.\\/.*\\.js$
        // ./path/to/module +3 modules
        break
      }
    } else if (!isInQueryString) {
      nameCandidate += ch
    }
  }

  return nameCandidate
}

function allIndexesOf(source: string, match: string): number[] {
  const indexes: number[] = []
  let lastCheckedIndex: number | undefined

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const index = source.indexOf(match, lastCheckedIndex)
    if (index !== -1) {
      indexes.push(index)
      lastCheckedIndex = index + match.length
    } else {
      break
    }
  }

  return indexes
}

/**
 * input '/workspace/foo/node_modules/@foo/bar/node_modules/abc/example.js'
 * rootPath '/workspace/foo'
 * return {
 *   path: '/workspace/foo/node_modules/@foo/bar/node_modules/abc'
 *   moduleName: 'abc'
 *   dependentPath: 'node_modules/@foo/bar/node_modules/abc'
 * }
 */
export function resolveNodeModulePath(fullPath: string, rootPath: string) {
  const modulesMatch = allIndexesOf(fullPath, 'node_modules')

  // not in node_modules
  if (!modulesMatch.length) {
    return undefined
  }
  const lastNodeModulesIndex = modulesMatch[modulesMatch.length - 1] + /* length of 'node_modules/' */ 13
  const nodeModulesPath = fullPath.slice(0, lastNodeModulesIndex)
  const shortPath = fullPath.slice(lastNodeModulesIndex)

  const path = resolvePathFunctions(fullPath)
  const shortPathParts = shortPath.split(path.sep)
  const moduleName = shortPathParts[0].startsWith('@') ? shortPathParts[0] + '/' + shortPathParts[1] : shortPathParts[0]

  const modulePath = path.join(nodeModulesPath, moduleName)
  const dependentPath = path.relative(rootPath, modulePath)

  return {
    path: modulePath,
    moduleName,
    dependentPath,
  }
}

export function getPackageMeta(modulePath: string, repoPath: string, buildPath: string): PackageMeta | null {
  // `fs (ignored)`
  // this case can not be detected in trimmed module name
  if (modulePath.endsWith('(ignored)')) {
    return null
  }

  const realPath = trimModuleName(modulePath)

  // not like a true file path
  if (!realPath.includes('/') && !realPath.includes('.')) {
    return null
  }

  const path = resolvePathFunctions(buildPath)
  const nodeModulePath = resolveNodeModulePath(path.resolve(buildPath, realPath), repoPath)

  if (nodeModulePath) {
    return {
      name: nodeModulePath.moduleName,
      path: nodeModulePath.dependentPath,
    }
  }

  const isWebpackInternal = /^\(webpack\)/.test(realPath)
  return {
    name: isWebpackInternal ? WEBPACK_INTERNAL_PATH : SOURCE_CODE_PATH,
    path: isWebpackInternal ? WEBPACK_INTERNAL_PATH : SOURCE_CODE_PATH,
  }
}

function resolvePathFunctions(test: string) {
  if (test.startsWith('/')) {
    return posix
  }

  return /\\/.test(test) ? win32 : posix
}
