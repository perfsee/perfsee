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

import fs from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'
import { gzipSync } from 'zlib'

import isValidNPMName from 'is-valid-npm-name'
import MemoryFS from 'memory-fs'
import webpack, { Entry } from 'webpack'

import { Externals, WebpackError, BuildPackageOptions, CreateEntryPointOptions } from '../common.types'
import makeWebpackConfig from '../config/make-webpack-config'
import {
  BuildError,
  CLIBuildError,
  EntryPointError,
  MissingDependencyError,
  UnexpectedBuildError,
} from '../errors/custom-error'
import getDependencySizes from '../get-dependency-size-tree'
import getParseTime from '../get-parse-time'

import Telemetry from './telemetry.utils'

const log = require('debug')('bp:worker')

type CompilePackageArgs = {
  name: string
  externals: Externals
  entry: Entry
  debug?: boolean
  minifier: 'terser' | 'esbuild'
}

type CompilePackageReturn = {
  stats: webpack.Stats
  error: WebpackError
  memoryFileSystem: MemoryFS
}

type BuildPackageArgs = {
  name: string
  installPath: string
  externals: Externals
  options: BuildPackageOptions
}

type WebpackStatsAsset = NonNullable<webpack.Stats.ToJsonOutput['assets']>[0]

const BuildUtils = {
  createEntryPoint(packageName: string, installPath: string, options: CreateEntryPointOptions) {
    const entryPath = path.join(installPath, options.entryFilename || 'index.js')

    let importStatement: string

    if (options.esm) {
      if (options.customImports) {
        importStatement = `
          import { ${options.customImports.join(', ')} } from '${packageName}';
          console.log(${options.customImports.join(', ')})
     `
      } else {
        importStatement = `import p from '${packageName}'; console.log(p)`
      }
    } else {
      if (options.customImports) {
        importStatement = `
        const { ${options.customImports.join(', ')} } = require('${packageName}');
        console.log(${options.customImports.join(', ')})
        `
      } else {
        importStatement = `const p = require('${packageName}'); console.log(p)`
      }
    }

    try {
      fs.writeFileSync(entryPath, importStatement, 'utf-8')
      return entryPath
    } catch (err) {
      throw new EntryPointError(err)
    }
  },

  compilePackage({ name, entry, externals, debug, minifier }: CompilePackageArgs) {
    const startTime = performance.now()
    const compiler = webpack(
      makeWebpackConfig({
        packageName: name,
        entry,
        externals,
        debug,
        minifier,
      }),
    )
    const memoryFileSystem = new MemoryFS()
    compiler.outputFileSystem = memoryFileSystem

    return new Promise<CompilePackageReturn>((resolve) => {
      compiler.run((err, stats) => {
        const error = err as unknown as WebpackError // Webpack types incorrect
        // stats object can be empty if there are build errors
        resolve({ stats, error, memoryFileSystem })

        if (error) {
          console.error(error)
          Telemetry.compilePackage(name, false, startTime, { minifier }, error)
        } else {
          Telemetry.compilePackage(name, true, startTime, { minifier })
        }
      })
    })
  },

  _parseMissingModules(errors: Array<WebpackError>) {
    const missingModuleErrors = errors.filter((error) => error.name === 'ModuleNotFoundError')

    if (!missingModuleErrors.length) {
      return []
    }

    // There's a better way to get the missing module's name, maybe ?
    const missingModuleRegex = /Can't resolve '(.+)' in/

    const missingModules = missingModuleErrors.map((err) => {
      const matches = err.error.toString().match(missingModuleRegex)

      if (!matches) {
        throw new UnexpectedBuildError(
          'Expected to find a file path in the module not found error, but found none. Regex for this might be out of date.',
        )
      }

      const missingFilePath = matches[1]
      let packageNameMatch
      if (missingFilePath.startsWith('@')) {
        packageNameMatch = missingFilePath.match(/@[^/]+\/[^/]+/) // @babel/runtime/object/create -> @babel/runtime
      } else {
        packageNameMatch = missingFilePath.match(/[^/]+/) // babel-runtime/object/create -> babel-runtime
      }

      if (!packageNameMatch) {
        throw new UnexpectedBuildError(
          'Failed to resolve the missing package name. Regex for this might be out of date.',
        )
      }

      return packageNameMatch[0]
    })

    let uniqueMissingModules = Array.from(new Set(missingModules))
    uniqueMissingModules = uniqueMissingModules.filter((mod) => !mod.startsWith(`${uniqueMissingModules[0]}/`))

    return uniqueMissingModules
  },

  async buildPackage({ name, installPath, externals, options }: BuildPackageArgs) {
    const entry: Entry = {}

    if (options.splitCustomImports) {
      if (!options.customImports || !options.customImports.length) {
        return { assets: [] }
      }
      options.customImports.forEach((importt) => {
        entry[importt] = BuildUtils.createEntryPoint(name, installPath, {
          customImports: [importt],
          entryFilename: importt,
          esm: true,
        })
      })
    } else {
      entry['main'] = BuildUtils.createEntryPoint(name, installPath, {
        esm: false,
        customImports: options.customImports,
      })
    }

    log('build start %s', name)
    const { stats, error, memoryFileSystem } = await BuildUtils.compilePackage({
      name,
      entry,
      externals,
      debug: options.debug,
      minifier: options.minifier,
    })

    log('build end %s', name)

    const jsonStatsStartTime = performance.now()
    const jsonStats = stats.toJson({
      assets: true,
      children: false,
      chunks: false,
      chunkGroups: false,
      chunkModules: false,
      chunkOrigins: false,
      modules: true,
      errorDetails: false,
      entrypoints: false,
      reasons: false,
      maxModules: 500,
      performance: false,
      source: true,
      depth: true,
      providedExports: true,
      warnings: false,
      modulesSort: 'depth',
    })

    if (!jsonStats) {
      Telemetry.parseWebpackStats(name, false, jsonStatsStartTime)
      throw new UnexpectedBuildError('Expected webpack json stats to be non-null, but was null')
    } else {
      Telemetry.parseWebpackStats(name, true, jsonStatsStartTime)
    }

    if (error && !stats) {
      throw new BuildError(error)
    } else if (stats.compilation.errors?.length) {
      const missingModules = BuildUtils._parseMissingModules(stats.compilation.errors)

      if (missingModules.length) {
        if (missingModules.length === 1 && missingModules[0] === name) {
          throw new EntryPointError(stats.compilation.errors.map((err) => err.toString()))
        } else {
          throw new MissingDependencyError(
            stats.compilation.errors.map((err) => err.toString()),
            { missingModules },
          )
        }
      } else if (jsonStats.errors && jsonStats.errors.length > 0) {
        if (jsonStats.errors.some((error) => error.includes("Unexpected character '#'"))) {
          throw new CLIBuildError(jsonStats.errors)
        } else {
          console.error(JSON.stringify(jsonStats.errors))
          throw new BuildError(jsonStats.errors)
        }
      } else {
        throw new UnexpectedBuildError('The webpack stats object was unexpectedly empty')
      }
    } else {
      const getAssetStats = (asset: WebpackStatsAsset) => {
        const bundle = path.join(process.cwd(), 'dist', asset.name)
        const bundleContents = memoryFileSystem.readFileSync(bundle)
        let parseTimes = null
        if (options.calcParse) {
          parseTimes = getParseTime(bundleContents)
        }

        const gzip = gzipSync(bundleContents, {}).length
        const matches = asset.name.match(/(.+?)\.bundle\.(.+)$/)

        if (!matches) {
          throw new UnexpectedBuildError(
            'Found an asset without the `.bundle` suffix. ' +
              'A loader customization might be needed to recognize this asset type' +
              asset.name,
          )
        }

        const [, entryName, extension] = matches

        return {
          name: entryName,
          type: extension,
          size: asset.size,
          gzip,
          parse: parseTimes,
        }
      }

      const assetsGzipStartTime = performance.now()
      const assetStats = jsonStats?.assets
        ?.filter((asset) => !asset.chunkNames.includes('runtime'))
        .filter((asset) => !asset.name.endsWith('LICENSE.txt'))
        .map(getAssetStats)
      Telemetry.assetsGZIPParseTime(name, assetsGzipStartTime)

      log('build result %O', assetStats)

      return {
        assets: assetStats || [],
        ...(options.includeDependencySizes && {
          dependencySizes: await getDependencySizes(name, jsonStats, options.minifier),
        }),
      }
    }
  },
  async buildPackageIgnoringMissingDeps({ name, externals, installPath, options }: BuildPackageArgs) {
    const buildStartTime = performance.now()
    let buildIteration = 1

    try {
      const buildResult = await BuildUtils.buildPackage({
        name,
        externals,
        installPath,
        options,
      })
      Telemetry.buildPackage(name, true, buildStartTime, {
        ...options,
        buildIteration,
      })
      return buildResult
    } catch (e) {
      buildIteration++
      if (
        e instanceof MissingDependencyError &&
        e.missingModules.length <= 6 &&
        e.missingModules.every((mod) => isValidNPMName(mod))
      ) {
        const { missingModules } = e.extra
        const newExternals = {
          ...externals,
          externalPackages: externals.externalPackages.concat(missingModules),
        }
        log('%s has missing dependencies, rebuilding without %o', name, missingModules)
        const rebuiltResult = await BuildUtils.buildPackage({
          name,
          externals: newExternals,
          installPath,
          options,
        })

        Telemetry.buildPackage(name, true, buildStartTime, {
          ...options,
          buildIteration,
          missingModules,
        })

        return {
          ignoredMissingDependencies: missingModules,
          ...rebuiltResult,
        }
      } else {
        Telemetry.buildPackage(
          name,
          false,
          buildStartTime,
          {
            ...options,
            buildIteration,
          },
          e,
        )
        throw e
      }
    }
  },
}
export default BuildUtils
