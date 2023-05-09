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

/*
Portions of this software were originally licensed under the MIT License.
See the MIT License for more details.
*/

/*
MIT License

Copyright (c) 2017 Shubham Kanodia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
The modifications to the original software were made by ByteDance,
and are licensed under the Apache License, Version 2.0.
*/

import childProcess from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

import builtInModules from 'builtin-modules'

const homeDirectory = os.homedir()

export function exec(command: string, options: any, timeout?: number) {
  let timerId: NodeJS.Timeout
  return new Promise((resolve, reject) => {
    const child = childProcess.exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(stderr)
      } else {
        resolve(stdout)
      }

      if (timerId) {
        clearTimeout(timerId)
      }
    })

    if (timeout) {
      timerId = setTimeout(() => {
        process.kill(child.pid!)
        reject(`Execution of ${command.substring(0, 40)}... cancelled as it exceeded a timeout of ${timeout} ms`)
      }, timeout)
    }
  })
}

/**
 * Gets external peerDeps that shouldn't be a
 * part of the build in a regex format -
 * /(^dep-a$|^dep-a\/|^dep-b$|^dep-b\/)\//
 */
export function getExternals(packageName: string, packageJSONPath: string) {
  const packageJSON = require(packageJSONPath)
  const dependencies = Object.keys(packageJSON.dependencies || {})
  const peerDependencies = Object.keys(packageJSON.peerDependencies || {})

  // All packages with name same as a built-in node module, but
  // haven't explicitly been added as an npm dependency or aren't the package itself
  // are externals
  const builtInExternals = builtInModules.filter((mod) => !dependencies.includes(mod) && mod !== packageName)
  return {
    externalPackages: peerDependencies,
    externalBuiltIns: builtInExternals,
  }
}

function expandTilde(pathString: string) {
  return homeDirectory ? pathString.replace(/^~(?=$|\/|\\)/, homeDirectory) : pathString
}

function isLocalPackageString(packageString: string) {
  const packageJsonPath = path.resolve(packageString, 'package.json')
  try {
    if (fs.existsSync(packageJsonPath)) {
      return true
    }
  } catch (err) {
    return false
  }
}

function isScopedPackageString(packageString: string) {
  return packageString.startsWith('@')
}

type ParsePackageResult = {
  name: string
  version: string | null
  scoped: boolean
  isLocal?: boolean
  normalPath?: string
}

function parseLocalPackageString(packageString: string): ParsePackageResult {
  const fullPath = path.resolve(packageString, 'package.json')
  const packageJSON = require(fullPath)

  return {
    name: packageJSON.name,
    version: packageJSON.version,
    scoped: packageJSON.name.startsWith('@'),
    normalPath: packageString,
    isLocal: true,
  }
}

function parseScopedPackageString(packageString: string): ParsePackageResult {
  const lastAtIndex = packageString.lastIndexOf('@')
  return {
    name: lastAtIndex === 0 ? packageString : packageString.substring(0, lastAtIndex),
    version: lastAtIndex === 0 ? null : packageString.substring(lastAtIndex + 1),
    scoped: true,
  }
}

function parseUnscopedPackageString(packageString: string): ParsePackageResult {
  const lastAtIndex = packageString.lastIndexOf('@')
  return {
    name: lastAtIndex === -1 ? packageString : packageString.substring(0, lastAtIndex),
    version: lastAtIndex === -1 ? null : packageString.substring(lastAtIndex + 1),
    scoped: false,
  }
}

export function parsePackageString(packageString: string): ParsePackageResult {
  const normalPackageString = expandTilde(packageString)

  if (isLocalPackageString(normalPackageString)) {
    return parseLocalPackageString(normalPackageString)
  } else if (isScopedPackageString(normalPackageString)) {
    return parseScopedPackageString(normalPackageString)
  } else {
    return parseUnscopedPackageString(normalPackageString)
  }
}
