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

import { dirname, resolve } from 'path'

import { Plugin } from 'rollup'

import {
  getBuildEnv,
  generateReports,
  getAllPackagesVersions,
  resolveModuleVersion,
  CommonPluginOptions as Options,
  initOptions,
  BuildUploadClient,
} from '@perfsee/plugin-utils'

import { rollupOutput2WebpackStats } from './adaptor'

export { NormalizedOutputOptions, OutputBundle } from 'rollup'
export { rollupOutput2WebpackStats }

let version = 'unknown'

try {
  version = require('../package.json').version
} catch (e) {
  console.error('Read self version failed', e)
}

export const PerfseePlugin = (userOptions: Options = {}): Plugin => {
  const options = initOptions({
    ...userOptions,
    toolkit: 'rollup',
  })

  const modulesMap = new Map<string, [version: string, sideEffects?: boolean | string[]]>()
  const buildPath = process.cwd()
  const repoPath = getBuildEnv().pwd
  let publicPath = '/'

  return {
    name: 'perfsee-rollup-plugin',
    configResolved(resolvedConfig: any) {
      // vite only hook
      publicPath = resolvedConfig.base
      options.toolkit = 'vite'
    },
    moduleParsed(moduleInfo) {
      const { id } = moduleInfo
      if (id.startsWith('\0')) {
        // Rollup convention, this id should be handled by the
        // plugin that marked it with \0
        return
      }

      const module = resolveModuleVersion(resolve(buildPath, id), repoPath)
      if (module) {
        const [name, version, sideEffects] = module
        modulesMap.set(name, [version, sideEffects])
      }
    },
    async writeBundle(outputOptions, outputBundle) {
      const outputPath = outputOptions.dir ?? (outputOptions.file && dirname(outputOptions.file)) ?? process.cwd()

      const stats = Object.assign(rollupOutput2WebpackStats.call(this, outputBundle), {
        outputPath,
        publicPath,
        packageVersions: getAllPackagesVersions(getBuildEnv().pwd, modulesMap),
      })

      const client = new BuildUploadClient(options, outputPath, version)
      await client.uploadBuild(stats)
      await generateReports(stats, outputPath, options)
    },
  }
}
