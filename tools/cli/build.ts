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

import { isAbsolute } from 'path'

import commonjs from '@rollup/plugin-commonjs'
import resolve from '@rollup/plugin-node-resolve'
import { Option } from 'clipanion'
import inquirer, { Question } from 'inquirer'
import { difference } from 'lodash'
import { rollup, RollupOptions } from 'rollup'
import dts from 'rollup-plugin-dts'
import sourcemaps from 'rollup-plugin-sourcemaps'

import { exists, packages, getPackage, PackageName } from '../utils'

import { Command } from './command'

const bundlePackages: PackageName[] = packages
  .filter((pkg) => pkg.packageJson.bundle)
  .map((pkg) => pkg.name) as PackageName[]

const question: Question = {
  type: 'list',
  name: 'Choose a package to build',
  choices: bundlePackages,
  prefix: '🛠',
}

/**
 * Build project and make it ready to be released as npm package
 */
export class BuildCommand extends Command {
  static paths = [[`build`]]

  package: PackageName = Option.String(`-p,--project`)!

  all = Option.Boolean(`-a,--all`, false)

  async execute() {
    if (this.package && !bundlePackages.includes(this.package)) {
      throw new TypeError(`please input right package name.`)
    }

    await this.prompt()
  }

  async prompt() {
    if (this.all) {
      await this.ts()
      await this.rollup()
      return
    }

    if (this.package) {
      return this.run(this.package)
    }

    const answer = await inquirer.prompt([question])
    await this.run(answer[question.name!])
  }

  async run(pkg: PackageName) {
    await this.ts()
    await this.rollup(pkg)
  }

  async ts() {
    await this.execAsync(`tsc -b ./tsconfigs/tsconfig.lib.json`)
  }

  async rollup(pkg?: PackageName) {
    const configs = getRollupConfigs(pkg)

    for (const config of configs) {
      if (!config.output) {
        continue
      }
      this.logger.info(`rollupping ${config.input}...`)
      const bundle = await rollup(config)

      const outputs = Array.isArray(config.output) ? config.output : [config.output]
      for (const output of outputs) {
        await bundle.write(output)
      }
      await bundle.close()
    }
  }
}

const externalsRepoPackages = packages.filter((pkg) => !pkg.packageJson.private).map((pkg) => pkg.name)

interface ExternalsPluginOptions {
  forceBundle?: string[]
  externals: string[]
}
export function externalsPlugin(options: ExternalsPluginOptions = { forceBundle: [], externals: [] }) {
  const externals = difference([...externalsRepoPackages, ...options.externals], options.forceBundle ?? [])

  return {
    name: 'rollup-plugin-externals',
    resolveId(source: string) {
      // somehow some source prefixed with `\x00`
      source = source.replace(/\\x00/, '')
      if (source.startsWith('.') || isAbsolute(source)) {
        return null
      }

      if (externals.some((external) => source === external || source.startsWith(`${external}/`))) {
        return false
      }

      return null
    },
  }
}

const defaultConfig: RollupOptions[] = [
  {
    input: `./esm/index.js`,
    plugins: [
      sourcemaps(),
      commonjs({ transformMixedEsModules: true }),
      resolve({
        preferBuiltins: true,
      }),
    ],
    treeshake: true,
    output: [
      {
        file: `./dist/index.cjs.js`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: `./dist/index.esm.js`,
        format: 'esm',
        sourcemap: true,
      },
    ],
  },
  {
    input: `./esm/index.js`,
    plugins: [
      commonjs({ transformMixedEsModules: true }),
      resolve({
        preferBuiltins: true,
      }),
      dts(),
    ],
    output: [{ file: './dist/index.d.ts', format: 'es' }],
  },
]

const getRollupConfigs = (name?: PackageName): RollupOptions[] => {
  const packagesToBundle = name ? [getPackage(name)] : packages.filter((pkg) => pkg.packageJson.bundle)

  return packagesToBundle
    .map((pkg) => {
      const rollupOverrideFile = pkg.relative('rollup.config.js')
      const localConfig = exists(rollupOverrideFile) ? require(rollupOverrideFile)(pkg.packageJson) : defaultConfig

      return localConfig.map((config: any) => ({
        ...config,
        input: pkg.relative(config.input),
        output: config.output?.map((outputConfig: any) => ({
          ...outputConfig,
          dir: outputConfig.dir ? pkg.relative(outputConfig.dir) : null,
          file: outputConfig.file ? pkg.relative(outputConfig.file) : null,
        })),
        plugins: [
          externalsPlugin({
            forceBundle: ['lighthouse'],
            externals: Object.keys(pkg.packageJson.dependencies ?? {}),
          }),
          ...(config.plugins || []),
        ],
      }))
    })
    .filter(Boolean)
    .flat()
}
