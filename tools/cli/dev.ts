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
import nodemon from 'nodemon'

import { getPackage, Package, PackageName } from '../utils'
import { getFrontendConfig } from '../webpack/frontend-config'
import { startDevServer } from '../webpack/webpack.config'

import { Command } from './command'

interface PackageDevInfo {
  type: 'node' | 'browser'
  env?: Record<string, string>
  ignore?: string[]
}

const allowPackages: { [key in PackageName]?: PackageDevInfo } = {
  '@perfsee/platform': {
    type: 'browser',
  },
  '@perfsee/platform-server': {
    type: 'node',
    ignore: ['node_modules/**/*', 'router.ts', 'packages/schema/**/*', '__tests__/**/*'],
    env: {
      DOTENV_CONFIG_PATH: getPackage('@perfsee/platform-server').relative('.env'),
    },
  },
  '@perfsee/job-runner': {
    type: 'node',
    ignore: ['node_modules/**/*', 'router.ts', '__tests__/**/*', 'tmp/**/*'],
    env: {
      PERFSEE_PLATFORM_HOST: process.env.PERFSEE_PLATFORM_HOST ?? 'http://localhost:3000',
      PERFSEE_REGISTRATION_TOKEN: 'x',
    },
  },
}

const packageQuestion: Question = {
  type: 'list',
  name: 'Choose a project to dev',
  choices: Object.keys(allowPackages),
  prefix: '🐒',
}

export class DevCommand extends Command {
  static paths = [[`dev`]]

  package: PackageName = Option.String(`-p,--package`)!
  inspect: boolean = Option.Boolean(`--inspect`)!

  async execute() {
    if (!this.package) {
      this.package = (await inquirer.prompt([packageQuestion]))[packageQuestion.name!]
    }
    const pkg = getPackage(this.package)
    const config = allowPackages[pkg.name]
    if (!config) {
      this.logger.error(`Start type of package ${pkg.name} is not defined.`)
      process.exit(1)
    }
    if (config.type === 'node') {
      await this.startNodeDev(pkg)
    } else {
      await this.startBrowserDev(pkg)
    }
  }

  async startNodeDev(pkg: Package) {
    return new Promise<void>((resolve) => {
      nodemon({
        exec: 'node',
        script: pkg.relative('src'),
        delay: 2500,
        nodeArgs: [
          '-r',
          'ts-node/register/transpile-only',
          '-r',
          'tsconfig-paths/register',
          this.inspect ? '--inspect' : undefined,
        ].filter(Boolean) as string[],
        env: {
          TS_NODE_PROJECT: './tsconfigs/tsconfig.cjs.json',
          NODE_ENV: 'development',
          DEBUG: 'perfsee:*',
          FORCE_COLOR: 'true',
          DEBUG_COLORS: 'true',
          ...allowPackages[pkg.name]?.env,
        },
        ignore: allowPackages[pkg.name]?.ignore,
        watch: pkg.allDeps.map((dep) => dep.relativePath).concat(pkg.relativePath),
        ext: 'js,ts',
      })
        .on('quit', () => {
          resolve()
        })
        .on('restart', (files) => {
          if (files) {
            console.info(`restart due to: ${files.join(', ')} changed`)
          }
        })
        .on('log', (log) => {
          console.info(log.colour)
        })
    })
  }

  async startBrowserDev(pkg: Package) {
    await startDevServer(pkg.entryPath, getFrontendConfig())
  }
}
