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

import { Plugin, PluginBuild } from 'esbuild'

import {
  CommonPluginOptions as Options,
  initOptions,
  BuildUploadClient,
  generateReports,
  serializeBundlerOptions,
} from '@perfsee/plugin-utils'

import { esbuildResult2Stats } from './adaptor'
import { getOutputPath } from './util'

export { BuildResult, BuildOptions, Metafile } from 'esbuild'

let version = 'unknown'

try {
  version = require('../package.json').version
} catch (e) {
  console.error('Read self version failed', e)
}

export { esbuildResult2Stats }

export const PerfseePlugin = (options: Options = {}): Plugin => {
  options = initOptions({
    ...options,
    toolkit: 'esbuild',
  })

  let outputPath: string

  return {
    name: 'perfsee-esbuild-plugin',
    setup(build: PluginBuild) {
      build.initialOptions.metafile = true

      outputPath = getOutputPath(build.initialOptions)

      build.onEnd(async ({ outputFiles, ...result }) => {
        const stats = esbuildResult2Stats(result, build.initialOptions)

        if (!options.ignoreBuildOptions) {
          stats.buildOptions = serializeBundlerOptions(build.initialOptions)
        }

        const client = new BuildUploadClient(options, outputPath, version)
        await client.uploadBuild(stats)
        await generateReports(stats, outputPath, options)
      })
    },
  }
}
