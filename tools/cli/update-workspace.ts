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

import { existsSync } from 'fs'
import { relative } from 'path'

import { exec, LernaListJson, packages, pathToRoot, prettier, rootPath, writeFileAsync } from '../utils'

import { Command } from './command'

const workspaceDefFile = pathToRoot('tools', 'utils', 'workspace.generated.ts')

export class UpdateWorkspaceCommand extends Command {
  static paths = [['update-workspace']]

  async execute() {
    const list = JSON.parse(exec('', 'lerna list -a --json', { silent: true })) as LernaListJson[]
    list.forEach((p) => {
      p.location = relative(rootPath, p.location).replace(/\\/g, '/')
    })
    await this.generateWorkspaceConsts(list)
    await this.generateTsConfigs()
  }

  async generateWorkspaceConsts(packageList: LernaListJson[]) {
    let content = '// Auto generated content by `yarn cli update-workspace`\n// DO NOT MODIFY THIS FILE MANUALLY\n'
    content += `export const packageList = ${JSON.stringify(packageList, null, 2)} as const\n\n`
    content += `export type PackageName = typeof packageList[number]['name']\n`

    await writeFileAsync(workspaceDefFile, prettier(content))
  }

  async generateTsConfigs() {
    const pathsConfigFile = pathToRoot('tsconfigs', 'tsconfig.paths.json')
    const projectConfigFile = pathToRoot('tsconfigs', 'tsconfig.project.json')
    const filteredPackages = packages.filter((p) => !p.name.startsWith('@example'))
    const pathsConfig = {
      compilerOptions: {
        baseUrl: './',
        paths: filteredPackages.reduce((paths, pkg) => {
          const pkgRelativePath = relative(rootPath, pkg.srcPath).replace(/\\/g, '/')
          paths[pkg.name] = [pkgRelativePath]
          paths[`${pkg.name}/*`] = [pkgRelativePath + '/*']
          return paths
        }, {}),
      },
    }

    const projectConfig = {
      compilerOptions: {
        noEmit: true,
      },
      include: [],
      references: filteredPackages
        .filter((p) => existsSync(p.relative('tsconfig.json')))
        .map((p) => ({ path: `../${p.relativePath}` }))
        .concat(
          {
            path: '../examples',
          },
          {
            path: '../tools',
          },
        ),
    }

    await writeFileAsync(pathsConfigFile, '// AUTO GENERATED\n' + prettier(JSON.stringify(pathsConfig), 'json'))
    await writeFileAsync(projectConfigFile, '// AUTO GENERATED\n' + prettier(JSON.stringify(projectConfig), 'json'))
  }
}
