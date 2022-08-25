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

import { Command, Option } from 'clipanion'
import inquirer, { Question } from 'inquirer'

import { runEsbuild } from '../../examples/esbuild'
import { runVite } from '../../examples/vite'
import { runExample } from '../../examples/webpack'
import { exists, getPackage, PackageName } from '../utils'

const examples: PackageName[] = ['@examples/duplicate-libs', '@examples/simple', '@examples/split-chunks']

const projectQuestion: Question = {
  type: 'list',
  name: 'Choose a example to run',
  choices: examples,
  prefix: '🐒',
}

const enum Toolkit {
  Webpack = 'webpack',
  Esbuild = 'esbuild',
  Vite = 'vite',
}

const runExampleFunc = {
  [Toolkit.Webpack]: async function (name: PackageName) {
    const pkg = getPackage(name)
    const webpackConfig = pkg.relative('webpack.config.js')

    return runExample(pkg.entryPath, exists(webpackConfig) ? require(webpackConfig) : {})
  },
  [Toolkit.Esbuild]: async function (name: PackageName) {
    const pkg = getPackage(name)
    return runEsbuild([pkg.entryPath])
  },
  [Toolkit.Vite]: async function (name: PackageName) {
    const pkg = getPackage(name)
    return runVite(pkg.path)
  },
}

export class ExampleCommand extends Command {
  static paths = [[`example`]]

  name: PackageName = Option.String(`-p,--project`)!

  toolkit: string[] | undefined = Option.Array(`-t,--toolkit`)

  async execute() {
    if (!this.name) {
      const answer = await inquirer.prompt([projectQuestion])
      this.name = answer[projectQuestion.name!]
    }
    for (const toolkit of this.toolkit ?? [Toolkit.Webpack, Toolkit.Esbuild, Toolkit.Vite]) {
      console.info(`Running ${toolkit} bundling.`)
      await runExampleFunc[toolkit](this.name)
    }
  }
}
