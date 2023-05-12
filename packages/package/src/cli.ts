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

import { lstatSync } from 'fs'
import { resolve } from 'path'

import chalk from 'chalk'
import { Cli, Command, Option } from 'clipanion'

import { Minifier, PackageJson } from './types'
import { anaylizeAndPack, uploadPack } from './upload'

function isDir(path: string) {
  const stat = lstatSync(path, { throwIfNoEntry: false })
  return stat?.isDirectory()
}

const readPackageJson = (path: string): PackageJson => {
  return require(resolve(path, 'package.json')) || {}
}

class PackageAnalyzeCommand extends Command {
  packageString: string = Option.String()

  platform = Option.String('--platform', { required: false, description: 'Perfsee platform server host.' })

  project = Option.String('--project', { description: 'Perfsee platform project id.' })

  target = Option.String('--target', {
    required: false,
    description: 'When target is `browser`, benchmarks will run in headless chrome on server.',
  }) as 'node' | 'browser'

  local = Option.Boolean('--local', {
    required: false,
    description: 'If true, benchmarks will run in local and result will not be uploaded to platform.',
  })

  minifier = Option.String('--minifier', {
    required: false,
    description: 'ESbuild is faster, albeit with marginally larger file sizes',
  }) as Minifier

  customImports = Option.Array('--customImports', {
    required: false,
    description:
      'By default, the default export is used for calculating sizes. Setting this option allows calculation of package stats based on more granular top-level exports.',
  })

  client = Option.String('--client', {
    required: false,
    description: 'Which client to use to install package for building',
  }) as 'npm' | 'yarn'

  benchmarkPattern = Option.String('--benchmarkPattern', {
    required: false,
    description: 'Glob pattern to find benchmark files.',
  })

  benchmarkTimeout = Option.String('--benchmarkTimeout', {
    required: false,
    description: 'Timeout for benchmark running.',
  })

  async execute() {
    const resolvedPath = resolve(this.packageString)
    if (isDir(resolvedPath)) {
      const packageJson = readPackageJson(resolvedPath)

      this.project ||= packageJson['perfsee'] || packageJson['perfsee']?.project
      if (!this.project) {
        return console.error(chalk.red('[perfsee] project id required.'))
      }

      if (!packageJson.name || !packageJson.version) {
        return console.error(chalk.red('[perfsee] missing name or verison in package.json.'))
      }
      const options = {
        packageString: this.packageString,
        platform: this.platform,
        target: this.target,
        project: this.project,
        local: this.local,
        minifier: this.minifier,
        customImports: this.customImports,
        client: this.client,
        benchmarkPattern: this.benchmarkPattern,
        benchmarkTimeout: this.benchmarkTimeout,
      }
      const packPath = await anaylizeAndPack(resolvedPath, packageJson, options)
      await uploadPack(packPath, this.project, packageJson as Required<PackageJson>, options, this.platform)
    } else {
      console.error(chalk.red('[perfsee] path not valid.'))
    }
  }
}

const cli = new Cli({
  binaryLabel: 'perfsee package sdk',
  binaryName: 'perfsee package',
})

cli.register(PackageAnalyzeCommand)

cli
  .run(process.argv.slice(2), {
    stdin: process.stdin,
    stdout: process.stdout,
    stderr: process.stderr,
  })
  .then((code) => {
    process.exit(code)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
