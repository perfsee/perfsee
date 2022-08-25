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

import { Option } from 'clipanion'
import inquirer, { Question } from 'inquirer'
import { first } from 'lodash'
import webpack from 'webpack'

import { getPackage, PackageName, packagePath, pathToRoot } from '../utils'
import { getFrontendConfig } from '../webpack/frontend-config'
import { getNodeConfig } from '../webpack/node-config'
import { runWebpack } from '../webpack/webpack.config'

import { Command } from './command'

const packages: PackageName[] = ['@perfsee/platform', '@perfsee/platform-server', '@perfsee/job-runner']

const projectQuestion: Question = {
  type: 'list',
  name: 'Choose a project to bundle',
  choices: packages,
  prefix: '🛠',
}

const webpackConfigs: { [index: string]: webpack.Configuration } = {
  '@perfsee/platform': {
    ...getFrontendConfig(),
    output: {
      path: pathToRoot('assets', 'platform'),
    },
  },
  '@perfsee/platform-server': {
    ...getNodeConfig(),
    entry: {
      main: packagePath('@perfsee/platform-server', 'src', 'index.ts'),
      cli: packagePath('@perfsee/platform-server', 'src', 'cli.app.ts'),
    },
  },
  '@perfsee/job-runner': getNodeConfig(),
  '@perfsee/bundle-report': {
    entry: {
      main: packagePath('@perfsee/bundle-report', 'src', 'static.tsx'),
    },
    devtool: 'inline-cheap-module-source-map',
    output: {
      path: packagePath('@perfsee/plugin-utils', 'public'),
      filename: '[name].js',
    },
    optimization: {
      splitChunks: false,
      runtimeChunk: false,
    },
  },
}

/**
 * Bundle project using webpack
 */
export class BundleCommand extends Command {
  static paths = [[`bundle`]]
  static async webpack(project: PackageName) {
    const pkg = getPackage(project)
    return runWebpack({ entry: pkg.entryPath, project: pkg.dirname }, 'production', webpackConfigs[project])
  }

  verbose = Option.Boolean(`-v,--verbose`, false)

  project: PackageName = Option.String(`-p,--project`)!

  async execute() {
    await this.webpackBuild()
  }

  private async webpackBuild() {
    let project: PackageName
    if (this.project) {
      project = this.project
    } else {
      const q = projectQuestion
      // @ts-expect-error
      if (q.choices.length === 1) {
        // @ts-expect-error
        project = first(q.choices)!
      } else {
        const answer = await inquirer.prompt([q])
        project = answer[q.name!]
      }
    }

    return BundleCommand.webpack(project)
  }
}
