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

import { join, parse } from 'path'

import { difference, intersection } from 'lodash'

import { rootPath } from './consts'
import { Logger } from './log'
import { packageList, PackageName } from './workspace.generated'

const logger = new Logger('workspace')

interface CommonPackageJsonContent {
  name: string
  main: string
  private?: boolean
  version: string
  dependencies?: { [key: string]: string }
  devDependencies?: { [key: string]: string }
  scripts?: { [key: string]: string }
  bundle?: boolean
}

export interface LernaListJson {
  name: string
  version: string
  private: boolean
  location: string
}

/**
 * ['name': Package]
 */
const packagesMap = new Map<string, Package>()

class CircularDependenciesError extends Error {
  constructor(public currentName: string) {
    super('Circular dependencies error')
  }
}

class ForbiddenPackageRefError extends Error {
  constructor(public currentName: string, public refName: string) {
    super(`Public package cannot reference private package. Found '${refName}' in dependencies of '${currentName}'`)
  }
}

export class Package {
  static getInstance(name: string) {
    return packagesMap.get(name)
  }

  /**
   * name of package
   *
   * eg. @perfsee/platform
   */
  name!: PackageName

  /**
   * folder name of package
   */
  dirname!: string

  /**
   * package.json content of package, is an object
   */
  packageJson!: CommonPackageJsonContent

  /**
   * version in package.json
   */

  version!: string

  /**
   * absolute path to package root
   *
   * eg. `/path/to/project/packages/main`
   */
  path!: string

  /**
   * relative path to project root
   *
   * eg. `packages/main`
   */
  relativePath!: string

  /**
   * absolute path to package src folder
   */
  srcPath!: string

  /**
   * absolute path to entry file.
   */
  entryPath!: string

  /**
   * absolute path to package build target path
   */
  distPath!: string

  /**
   * absolute path to node_modules folder under packages
   */
  nodeModulesPath!: string

  /**
   * Direct internal(workspace) dependencies
   */
  deps: Package[] = []

  /**
   * get all internal(workespace) dependencies with nested ones
   */
  get allDeps() {
    const deps = new Map(this.deps.map((dep) => [dep.name, dep]))
    for (const dep of this.deps) {
      for (const nestedDep of dep.allDeps) {
        if (!deps.has(nestedDep.name)) {
          deps.set(nestedDep.name, nestedDep)
        }
      }
    }

    return Array.from(deps.values())
  }

  constructor(info: LernaListJson) {
    const { location: relativePath, name } = info
    const packageJsonPath = join(rootPath, relativePath, 'package.json')
    const packageJsonContent: CommonPackageJsonContent = require(packageJsonPath)

    this.name = name as PackageName

    this.initPaths(relativePath, packageJsonContent.main ?? './src/index.ts')
    this.initInfo(packageJsonContent)
    packagesMap.set(name, this)
  }

  initInfo(packageJsonContent: CommonPackageJsonContent) {
    this.packageJson = packageJsonContent
    this.version = packageJsonContent.version
  }

  initPaths(relativePath: string, entry: string) {
    this.dirname = parse(relativePath).name
    this.path = join(rootPath, relativePath)
    this.relativePath = relativePath
    this.srcPath = this.relative('src')
    this.entryPath = this.relative(entry)
    this.nodeModulesPath = this.relative('node_modules')
    this.distPath = this.relative('dist')
  }

  dependOn(name: string, directly = false): boolean {
    for (const dep of this.deps) {
      if (dep.name === name) {
        return true
      }

      if (!directly && dep.dependOn(name, false)) {
        return true
      }
    }

    return false
  }

  relative(...paths: string[]): string {
    return join(this.path, ...paths)
  }
}

function buildDeps(pkg: Package, packages: Package[], building: Set<string>) {
  if (pkg.deps.length) {
    return
  }

  building.add(pkg.name)
  pkg.deps = Object.keys({ ...pkg.packageJson.dependencies })
    .filter((dep) => packages.some(({ name }) => name === dep))
    .map((dep) => {
      if (building.has(dep)) {
        throw new CircularDependenciesError(pkg.name)
      }

      const depPkg = packagesMap.get(dep)!
      if (!pkg.packageJson.private && depPkg.packageJson.private) {
        throw new ForbiddenPackageRefError(pkg.name, dep)
      }

      buildDeps(depPkg, packages, building)
      return depPkg
    })
  building.delete(pkg.name)
}

function initWorkspace() {
  const packages = packageList
    .map((info) => {
      try {
        return new Package(info)
      } catch (e: any) {
        logger.error(`Failed to load package ${info.name}: ${e.message}`)
        return null
      }
    })
    .filter(Boolean) as Package[]

  const building = new Set<string>()
  packages.forEach((pkg) => {
    try {
      buildDeps(pkg, packages, building)
    } catch (e) {
      if (e instanceof CircularDependenciesError) {
        const inProcessPackages = Array.from(building)
        const circle = inProcessPackages.slice(inProcessPackages.indexOf(e.currentName)).concat(e.currentName)
        logger.error(`Circular dependencies found: \n  ${circle.join(' -> ')}`)
        process.exit(1)
      }
      throw e
    }
  })

  return packages
}

export const packages: Package[] = initWorkspace()
export const allPackageNames = packages.map((p) => p.name) as PackageName[]

export function getPackage(name: PackageName): Package {
  const pkg = Package.getInstance(name)

  if (!pkg) {
    throw new Error(`unknown package name '${name}'`)
  }

  return pkg
}

export function filterPackages(specified: PackageName[] = [], all = allPackageNames, ignored: PackageName[] = []) {
  if (!all.length) {
    throw new Error('No packages found.')
  }

  const unknownPackages = specified.filter((p) => !all.includes(p))
  if (unknownPackages.length) {
    throw new Error(`Unknown packages: [${unknownPackages.join(', ')}]`)
  }

  ignored = intersection(all, ignored)
  const filteredPackages = specified.length ? specified : all.slice(0)
  return difference(filteredPackages, ignored)
}

export function packagePath(packageName: PackageName, ...paths: string[]) {
  return getPackage(packageName).relative(...paths)
}
