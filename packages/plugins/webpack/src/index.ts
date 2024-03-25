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

import { relative, sep } from 'path'

import chalk from 'chalk'
import {
  WebpackPluginInstance,
  Compiler,
  Stats,
  WebpackOptionsNormalized as Configuration,
  Compilation,
  Module,
} from 'webpack'

import { BundleToolkit, ID, PerfseeReportStats, Reason, StatsParser, hashCode } from '@perfsee/bundle-analyzer'
import {
  CommonPluginOptions as Options,
  initOptions,
  BuildUploadClient,
  getAllPackagesVersions,
  generateReports,
  getBuildEnv,
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
  private context?: string
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
      this.context = compiler.options.context
    })

    try {
      compiler.resolverFactory.hooks.resolver.for('normal').tap(PerfseePlugin.PluginName, (resolver) => {
        try {
          resolver.hooks.result.tap(PerfseePlugin.PluginName, (request) => {
            catchModuleVersionFromRequest(request, this.modules, this.context || process.cwd(), getBuildEnv().pwd)
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
    this.stats.packageVersions = getAllPackagesVersions(getBuildEnv().pwd, this.modules)
    this.stats.repoPath = getBuildEnv().pwd
    this.stats.buildPath = this.context || process.cwd()
    this.stats.buildTool = BundleToolkit.Webpack

    return this
  }

  // @internal
  async reportStats() {
    const client = new BuildUploadClient(this.options, this.outputPath, version)
    await client.uploadBuild(this.stats)
    await generateReports(this.stats, this.outputPath, this.options)
  }

  private parseModuleSource(module: Module, reasonsMap: Map<ID, Reason[]>) {
    // @ts-expect-error
    module.modules?.forEach((module) => this.parseModuleSource(module, reasonsMap))
    const source = module.originalSource()?.source()
    if (!source) {
      return
    }
    const id = hashCode(module.identifier())
    if (source instanceof Buffer || !source || !id) {
      return
    }
    const reasons = reasonsMap.get(id)
    if (!reasons?.length) {
      return
    }
    const lines = reasons
      .map((r) => r[1]?.split(':')[0])
      .filter(Boolean)
      .map((l) => Number(l) - 1)
    const sourceFiltered = source
      .split('\n')
      .map((lineSource, lineNum) => {
        if (lines.some((l) => Math.abs(l - lineNum) <= 1)) {
          return lineSource || ' '
        }
        return ''
      })
      .join('\n')
    const path = module.nameForCondition()
    this.stats.moduleReasons ||= {
      moduleSource: {},
    }
    this.stats.moduleReasons!.moduleSource![id] = [
      path ? relative(this.stats.buildPath!, path) : 'unkown',
      sourceFiltered,
    ]
  }

  private readonly collectModuleSources = (compilation: Compilation) => {
    try {
      const reasonsMap = StatsParser.FromStats(this.stats, this.outputPath).parseReasons()
      compilation.modules.forEach((module) => this.parseModuleSource(module, reasonsMap))
    } catch (e) {
      console.error(chalk.red(`Collect module sources failed, due to: ${(e as Error).message}`))
    }
  }

  private readonly handleEmit = (compilation: Compilation) => {
    if (!this.outputPath) {
      return
    }

    try {
      this.setStats(compilation.getStats())
      this.collectModuleSources(compilation)
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
