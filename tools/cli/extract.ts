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

import { mkdir, rename, rm, writeFile } from 'fs/promises'
import { basename, resolve, join } from 'path'

import { Option } from 'clipanion'

import { allPackageNames, getPackage, PackageName, packagePath, writeFileAsync } from '../utils'

import { Command } from './command'

/**
 * Extract a module and its dependencies from the monorepo so that it can be run independently
 */
export class ExtractCommand extends Command {
  static paths = [[`extract`]]

  package: PackageName = Option.String(`-p,--project`)!

  output: string = Option.String(`-o,--output`)!

  async execute() {
    if (!this.output) {
      throw new Error(`Output directory is required`)
    }

    const outputPath = resolve(process.cwd(), this.output)
    const pkg = getPackage(this.package)

    // 1. Create the output directory
    await mkdir(outputPath, { recursive: true })
    const tmpPath = outputPath + '/tmp'
    await mkdir(tmpPath, { recursive: true })

    // 2. run `yarn pack` and then unpack, to clean up unnecessary files
    await this.execAsync([`yarn`, 'pack', '--out', tmpPath + `/${pkg.dirname}.tgz`], { cwd: packagePath(this.package) })
    await this.execAsync(['tar', '-xvzf', tmpPath + `/${pkg.dirname}.tgz`], { cwd: tmpPath })

    // 3. Move the package to the output directory
    const extractPath = outputPath + '/' + pkg.dirname
    await rm(extractPath, { recursive: true, force: true })
    await rename(tmpPath + '/package', extractPath)

    // 4. Process package.json, replace dependencies in monorepo with absolute paths, and add resolutions for all monorepo packages
    const packageJson = require(extractPath + '/package.json')
    const dependencies = packageJson.dependencies
    const extractDependencies = {}
    for (const dependency in dependencies) {
      const version = dependencies[dependency]

      if (allPackageNames.includes(dependency as PackageName)) {
        extractDependencies[dependency] = 'file:' + packagePath(dependency as PackageName)
      } else {
        extractDependencies[dependency] = version
      }
    }
    await writeFile(
      extractPath + '/package.json',
      JSON.stringify(
        {
          ...packageJson,
          dependencies: extractDependencies,
          resolutions: {
            ...pkg.allDeps.reduce((deps, pkg) => {
              deps[pkg.name] = pkg.path
              return deps
            }, {}),
            ...packageJson.resolutions,
          },
          devDependencies: {},
        },
        null,
        2,
      ),
    )

    // 5. install dependencies
    // make `yarn install` available in non-workspace package
    await writeFileAsync(join(extractPath, 'yarn.lock'), '')
    await writeFileAsync(join(extractPath, '.yarnrc.yml'), `enableGlobalCache: true`)
    await this.execAsync('yarn', {
      cwd: extractPath,
      env: {
        NODE_ENV: 'production',
      },
    })

    // 6. Compress the package
    await this.execAsync(['tar', '-czf', basename(extractPath) + '.tgz', '-C', extractPath, '.'], { cwd: outputPath })
  }
}
