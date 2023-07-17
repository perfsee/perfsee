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

/**
 * Parts of the code are inspired from the `import-cost` project
 * @see https://github.com/wix/import-cost/blob/master/packages/import-cost/src/webpack.js
 */

import { promises as fs } from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'

import { GetPackageStatsOptions } from './common.types'
import { UnexpectedBuildError } from './errors/custom-error'
import BuildUtils from './utils/build.utils'
import { getExternals, parsePackageString } from './utils/common.utils'
import InstallationUtils from './utils/installation.utils'
import Telemetry from './utils/telemetry.utils'

function getPackageJSONDetails(packageName: string, packageJSONPath: string) {
  const startTime = performance.now()
  return fs.readFile(packageJSONPath, 'utf8').then(
    (contents: string) => {
      const parsedJSON = JSON.parse(contents)
      Telemetry.getPackageJSONDetails(parsedJSON, true, startTime)

      return {
        dependencyCount: 'dependencies' in parsedJSON ? Object.keys(parsedJSON.dependencies).length : 0,
        hasJSNext: parsedJSON['jsnext:main'] || false,
        hasJSModule: parsedJSON['module'] || false,
        isModuleType: parsedJSON['type'] === 'module',
        hasSideEffects: 'sideEffects' in parsedJSON ? parsedJSON['sideEffects'] : true,
        peerDependencies: 'peerDependencies' in parsedJSON ? Object.keys(parsedJSON.peerDependencies) : [],
        packageJson: parsedJSON,
        version: parsedJSON['version'],
        name: parsedJSON['name'],
      }
    },
    (err) => {
      Telemetry.getPackageJSONDetails({ name: packageName }, false, startTime, err)
    },
  )
}

export default async function getPackageStats(packageString: string, optionsRaw: GetPackageStatsOptions) {
  const startTime = performance.now()
  const defaultMinifier: 'terser' = 'terser'

  const options = {
    minifier: defaultMinifier,
    ...optionsRaw,
  }

  const { name: packageName, isLocal } = parsePackageString(packageString)
  const installPath = await InstallationUtils.preparePath(packageString, packageName, isLocal)

  if (options.debug) {
    console.info('Install path:', installPath)
  }
  try {
    await InstallationUtils.installPackage(packageString, installPath, {
      isLocal,
      client: options.client,
      limitConcurrency: options.limitConcurrency,
      networkConcurrency: options.networkConcurrency,
      installTimeout: options.installTimeout,
    })

    const packageJSONPath = isLocal
      ? path.join(packageString, 'package.json')
      : path.join(installPath, 'node_modules', packageName, 'package.json')

    const externals = getExternals(packageName, packageJSONPath)
    const [pacakgeJSONDetails, builtDetails] = await Promise.all([
      getPackageJSONDetails(packageName, packageJSONPath),
      BuildUtils.buildPackageIgnoringMissingDeps({
        name: packageName,
        installPath,
        externals,
        options: {
          debug: options.debug,
          customImports: options.customImports,
          minifier: options.minifier,
          includeDependencySizes: true,
          webpackConfig: options.webpackConfig,
        },
      }),
    ])

    const hasCSSAsset = builtDetails.assets.some((asset) => asset.type === 'css')
    const mainAsset = builtDetails.assets.find(
      (asset) => asset.name === 'main' && asset.type === (hasCSSAsset ? 'css' : 'js'),
    )

    if (!mainAsset) {
      throw new UnexpectedBuildError('Did not find a main asset in the built bundle')
    }

    Telemetry.packageStats(packageString, true, performance.now() - startTime, options)
    return {
      ...pacakgeJSONDetails,
      ...builtDetails,
      size: mainAsset.size,
      gzip: mainAsset.gzip,
      parse: mainAsset.parse,
    }
  } catch (e) {
    Telemetry.packageStats(packageString, false, performance.now() - startTime, options)
    throw e
  } finally {
    if (!options.debug) {
      await InstallationUtils.cleanupPath(installPath)
    }
  }
}
