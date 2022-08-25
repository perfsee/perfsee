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

import { sep } from 'path'

import chalk from 'chalk'
import { WebpackPluginInstance, Compiler, Stats, WebpackOptionsNormalized as Configuration, Compilation } from 'webpack'

import { BundleToolkit, PerfseeReportStats } from '@perfsee/bundle-analyzer'
import {
  CommonPluginOptions as Options,
  initOptions,
  BuildUploadClient,
  getAllPackagesVersions,
  generateReports,
  BUILD_ENV,
  catchModuleVersionFromRequest,
} from '@perfsee/plugin-utils'

export interface StatsReport {
  reports: string
  duplicated: string
}

let version = 'unknown'

try {
  version = require('../package.json').version
} catch (e) {
  console.error('Read self version failed', e)
}

const webpackStatsToJsonOptions: Parameters<Stats['toJson']>[0] = {
  hash: true,
  publicPath: true,
  assets: true,
  chunks: true,
  chunkModules: true,
  chunkGroups: false,
  chunkOrigins: false,
  depth: false,
  modules: false,
  source: false,
  timings: false,
  warnings: false,
  errors: false,
  performance: false,
  timing: false,
}

export class PerfseePlugin implements WebpackPluginInstance {
  private static readonly PluginName = 'perfsee-plugin'

  private readonly options: Options
  private outputPath!: string
  private stats!: PerfseeReportStats
  private readonly modules = new Map<string, string>()

  constructor(options: Options = {}) {
    this.options = initOptions(options)
  }

  // @internal
  isTargetWeb(options: Configuration) {
    const targetSetting = options.target
    const targets: string[] | undefined =
      typeof targetSetting === 'string' ? [targetSetting] : Array.isArray(targetSetting) ? targetSetting : undefined
    return !targets || targets.includes('web')
  }

  apply = (compiler: Compiler) => {
    // we do not analyze programs for `node` or in development mode which is meanless
    if (!this.isTargetWeb(compiler.options) || compiler.options.mode === 'development') {
      return
    }

    compiler.hooks.beforeRun.tap(PerfseePlugin.PluginName, (compiler) => {
      this.setOutputPath(compiler.outputPath)
    })

    try {
      compiler.resolverFactory.hooks.resolver.for('normal').tap(PerfseePlugin.PluginName, (resolver) => {
        try {
          resolver.hooks.result.tap(PerfseePlugin.PluginName, (request) => {
            catchModuleVersionFromRequest(request, this.modules, process.cwd(), BUILD_ENV.pwd)
          })
        } catch (e) {
          console.error('failed when applying module version catcher: ', e)
        }
      })
    } catch (e) {
      console.error('failed when applying module version catcher: ', e)
    }

    compiler.hooks.emit.tap(PerfseePlugin.PluginName, this.handleEmit)
    compiler.hooks.afterEmit.tapPromise(PerfseePlugin.PluginName, this.afterEmit)
  }

  // @internal
  setOutputPath(outputPath: string) {
    this.outputPath = outputPath.endsWith(sep) ? outputPath : outputPath + sep
    return this
  }

  // @internal
  setStats(stats: Stats) {
    this.stats = stats.toJson(webpackStatsToJsonOptions) as any
    this.stats.packageVersions = getAllPackagesVersions(BUILD_ENV.pwd, this.modules)
    this.stats.repoPath = BUILD_ENV.pwd
    this.stats.buildPath = process.cwd()
    this.stats.buildTool = BundleToolkit.Webpack

    return this
  }

  // @internal
  async reportStats() {
    const client = new BuildUploadClient(this.options, this.outputPath, version)
    await client.uploadBuild(this.stats)
    await generateReports(this.stats, this.outputPath, this.options)
  }

  private readonly handleEmit = (compilation: Compilation) => {
    if (!this.outputPath) {
      return
    }

    try {
      this.setStats(compilation.getStats())
    } catch (e) {
      console.error(chalk.red(`Parse webpack stats failed, due to: ${(e as Error).message}`))
    }
  }

  private readonly afterEmit = async () => {
    if (!this.outputPath) {
      return
    }

    await this.reportStats()
  }
}
