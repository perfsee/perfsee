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

import {
  getPackageStats,
  getPackageExportSizes,
  getAllPackageExports,
  GetPackageStatsOptions,
} from '@perfsee/package-build-stats'

import { Logger, PackageJson } from './types'

export function getConsoleLogger(): Logger {
  // @ts-expect-error
  // eslint-disable-next-line no-console
  console.verbose = console.log

  // @ts-expect-error
  return console
}

export type PackageStats = (ReturnType<typeof getPackageStats> extends Promise<infer T> ? T : never) & {
  version: string
} & {
  exports: ReturnType<typeof getAllPackageExports> extends Promise<infer T> ? T : never
  ignoredMissingDependencies: string[]
  name: string
  version: string
  packageJson: PackageJson
}

export const analyze = async (packageString: string, options: GetPackageStatsOptions, logger = getConsoleLogger()) => {
  const result = await getPackageStats(packageString, options)

  try {
    const packageExports = await getPackageExportSizes(packageString, options)
    const { dependencySizes } = packageExports
    if (dependencySizes && !dependencySizes.some((dep) => dep.name === result.name)) {
      dependencySizes.push({
        name: result.name,
        approximateSize: result.size - dependencySizes.reduce((sum, val) => sum + val.approximateSize, 0),
      })
    }
    Object.assign(result, packageExports)
  } catch (e) {
    logger.error('Get package export sizes failed: ', { error: e })
  }

  return result as PackageStats
}
