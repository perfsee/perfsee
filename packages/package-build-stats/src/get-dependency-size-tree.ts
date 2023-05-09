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

import path from 'path'
import { performance } from 'perf_hooks'

import * as esbuild from 'esbuild'
import Terser from 'terser'
import webpack from 'webpack'

import { MinifyError } from './errors/custom-error'
import Telemetry from './utils/telemetry.utils'

/**
 * A fork of `webpack-bundle-size-analyzer`.
 * https://github.com/robertknight/webpack-bundle-size-analyzer
 */

function modulePath(identifier: string) {
  // the format of module paths is
  //   '(<loader expression>!)?/path/to/module.js'
  const loaderRegex = /.*!/
  return identifier.replace(loaderRegex, '')
}

function getByteLen(normal_val: string) {
  // Force string type
  normal_val = String(normal_val)

  let byteLen = 0
  for (let i = 0; i < normal_val.length; i++) {
    const c = normal_val.charCodeAt(i)
    byteLen +=
      c < 1 << 7
        ? 1
        : c < 1 << 11
        ? 2
        : c < 1 << 16
        ? 3
        : c < 1 << 21
        ? 4
        : c < 1 << 26
        ? 5
        : c < 1 << 31
        ? 6
        : Number.NaN
  }
  return byteLen
}

async function minifyDependencyCode(source: string, minifier: 'terser' | 'esbuild' = 'terser') {
  if (minifier === 'terser') {
    return Terser.minify(source, {
      mangle: false,
      compress: {
        arrows: true,
        booleans: true,
        collapse_vars: true,
        comparisons: true,
        conditionals: true,
        dead_code: true,
        drop_console: false,
        drop_debugger: true,
        ecma: 5,
        evaluate: true,
        expression: false,
        global_defs: {},
        hoist_vars: false,
        ie8: false,
        if_return: true,
        inline: true,
        join_vars: true,
        keep_fargs: true,
        keep_fnames: false,
        keep_infinity: false,
        loops: true,
        negate_iife: true,
        passes: 1,
        properties: true,
        pure_getters: 'strict',
        reduce_vars: true,
        sequences: true,
        side_effects: true,
        switches: true,
        top_retain: null,
        toplevel: false,
        typeofs: true,
        unsafe: false,
        unused: true,
      },
      output: {
        comments: false,
      },
    })
  } else {
    return esbuild.transform(
      // ESBuild Minifier doesn't auto-remove license comments from code
      // So, we break ESBuild's heuristic for license comments match. See github.com/privatenumber/esbuild-loader/issues/87
      source
        .replace(/@license/g, '@silence')
        .replace(/\/\/!/g, '//')
        .replace(/\/\*!/g, '//'),
      { minify: true },
    )
  }
}

type MakeModule = {
  path: string
  sources: string[]
  source: string
}

type StatsChild = {
  path: string
  packageName: string
  sources: string[]
  children: StatsChild[]
}

type StatsTree = {
  packageName: string
  sources: string[]
  children: StatsChild[]
}

async function bundleSizeTree(packageName: string, stats: webpack.Stats.ToJsonOutput, minifier: 'terser' | 'esbuild') {
  const startTime = performance.now()
  const statsTree: StatsTree = {
    packageName: '<root>',
    sources: [],
    children: [],
  }

  if (!stats.modules) return []

  // extract source path for each module
  const modules: MakeModule[] = []
  const makeModule = (mod: webpack.Stats.FnModules): MakeModule => {
    // Uglifier cannot minify a json file, hence we need
    // to make it valid javascript syntax
    const isJSON = mod.identifier.endsWith('.json')
    const source = isJSON ? `$a$=${mod.source}` : mod.source

    return {
      path: modulePath(mod.identifier),
      sources: [source || ''],
      source: source || '',
    }
  }

  stats.modules
    .filter((mod) => !mod.name.startsWith('external'))
    .forEach((mod) => {
      if (mod.modules) {
        mod.modules.forEach((subMod) => {
          modules.push(makeModule(subMod))
        })
      } else {
        modules.push(makeModule(mod))
      }
    })

  modules.sort((a, b) => {
    if (a === b) {
      return 0
    } else {
      return a < b ? -1 : 1
    }
  })

  modules.forEach((mod) => {
    // pnpm will serve packages from a global symlink (.pnpm/package@verison/node_modules/package)
    // needs to be stripped off
    const pnpmPrefix = '.pnpm\\' + path.sep + '.+\\' + path.sep + 'node_modules\\' + path.sep
    const packages = mod.path.split(new RegExp('\\' + path.sep + 'node_modules\\' + path.sep + `(?:${pnpmPrefix})?`))

    if (packages.length > 1) {
      const lastSegment = packages.pop()

      if (!lastSegment) return

      let lastPackageName
      if (lastSegment[0] === '@') {
        // package is a scoped package
        const offset = lastSegment.indexOf(path.sep) + 1
        lastPackageName = lastSegment.slice(0, offset + lastSegment.slice(offset).indexOf(path.sep))
      } else {
        lastPackageName = lastSegment.slice(0, lastSegment.indexOf(path.sep))
      }
      packages.push(lastPackageName)
    }
    packages.shift()

    let parent = statsTree
    packages.forEach((pkg) => {
      const existing = parent.children.filter((child) => child.packageName === pkg)
      if (existing.length > 0) {
        existing[0].sources.push(mod.source)
        parent = existing[0]
      } else {
        const newChild = {
          path: mod.path,
          packageName: pkg,
          sources: [mod.source],
          children: [],
        }
        parent.children.push(newChild)
        parent = newChild
      }
    })
  })

  const resultPromises = statsTree.children
    .map((treeItem) => ({
      ...treeItem,
      sources: treeItem.sources.filter((source) => !!source),
    }))
    .filter((treeItem) => treeItem.sources.length)
    .map(async (treeItem) => {
      const sourceMinifiedPromises = treeItem.sources.map(async (code) => {
        return minifyDependencyCode(code, minifier)
      })

      try {
        const sources = await Promise.all(sourceMinifiedPromises)
        const size = sources.reduce((acc, source) => {
          return acc + getByteLen(source.code || '')
        }, 0)

        return {
          name: treeItem.packageName,
          approximateSize: size,
        }
      } catch (error: any) {
        const { message, filename } = error
        throw new MinifyError(error, {
          message: message,
          filePath: filename,
        })
      }
    })

  try {
    const results = await Promise.all(resultPromises)
    Telemetry.dependencySizes(packageName, startTime, true, { minifier })
    return results
  } catch (e) {
    Telemetry.dependencySizes(packageName, startTime, false, { minifier }, e)
    throw e
  }
}

export default bundleSizeTree
