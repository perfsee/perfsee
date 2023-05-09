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

import { GetPackageStatsOptions, InstallPackageOptions } from './common.types'
import BuildUtils from './utils/build.utils'
import { getExternals, parsePackageString } from './utils/common.utils'
import { getAllExports } from './utils/exports.utils'
import InstallationUtils from './utils/installation.utils'
import Telemetry from './utils/telemetry.utils'

const debug = require('debug')('bp:worker')

async function installPackage(packageString: string, installPath: string, options: InstallPackageOptions) {
  const { isLocal } = parsePackageString(packageString)

  await InstallationUtils.installPackage(packageString, installPath, {
    isLocal,
    client: options.client,
    limitConcurrency: options.limitConcurrency,
    networkConcurrency: options.networkConcurrency,
    installTimeout: options.installTimeout,
  })
}

export async function getAllPackageExports(packageString: string, options: InstallPackageOptions = {}) {
  const startTime = performance.now()
  const { name: packageName, isLocal } = parsePackageString(packageString)
  const installPath = await InstallationUtils.preparePath(packageString, packageName, isLocal)

  try {
    await installPackage(packageString, installPath, options)
    const results = await getAllExports(packageString, isLocal ? packageString : installPath, packageName)
    Telemetry.packageExports(packageString, startTime, true)
    return results
  } catch (err) {
    Telemetry.packageExports(packageString, startTime, false, err)
    throw err
  } finally {
    InstallationUtils.cleanupPath(installPath)
  }
}

export async function getPackageExportSizes(
  packageString: string,
  options: GetPackageStatsOptions = {
    minifier: 'terser',
  },
) {
  const startTime = performance.now()
  const { name: packageName, isLocal } = parsePackageString(packageString)
  const installPath = await InstallationUtils.preparePath(packageString, packageName, isLocal)

  try {
    await installPackage(packageString, installPath, options)

    const exportMap = await getAllExports(packageString, isLocal ? packageString : installPath, packageName)

    const exports = Object.keys(exportMap).filter((exp) => !(exp === 'default'))
    debug('Got %d exports for %s', exports.length, packageString)

    const packageJSONPath = isLocal
      ? path.join(packageString, 'package.json')
      : path.join(installPath, 'node_modules', packageName, 'package.json')
    const externals = getExternals(packageName, packageJSONPath)

    const builtDetails = await BuildUtils.buildPackageIgnoringMissingDeps({
      name: packageName,
      installPath,
      externals,
      options: {
        customImports: exports,
        splitCustomImports: true,
        includeDependencySizes: false,
        minifier: options.minifier || 'terser',
      },
    })

    Telemetry.packageExportsSizes(packageString, startTime, true, options)
    return {
      ...builtDetails,
      assets: builtDetails.assets.map((asset) => ({
        ...asset,
        path: exportMap[asset.name],
      })),
    }
  } catch (err) {
    Telemetry.packageExportsSizes(packageString, startTime, false, options, err)
    throw err
  } finally {
    InstallationUtils.cleanupPath(installPath)
  }
}
