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
import { resolve } from 'path'

import { BuildOptions, BuildResult, Metafile } from 'esbuild'
import { union } from 'lodash'

import {
  AssetTypeEnum,
  PerfseeReportStats,
  detectFileType,
  BundleToolkit,
  BundleChunkGroup,
} from '@perfsee/bundle-analyzer'
import {
  getBuildEnv,
  getAllPackagesVersions,
  resolveModuleVersion,
  serializeBundlerOptions,
} from '@perfsee/plugin-utils'

import { Chunk } from './type'
import {
  getOutputPath,
  isSourceMap,
  getChunkName,
  pathToName,
  fileMatch,
  initChunkMap,
  initModuleMap,
  recursivelyFindEntryChunkIds,
  findAssets,
} from './util'

const resolveModulesVersion = ({ inputs }: Metafile, rootPath: string, buildPath: string) => {
  const modulesMap = new Map<string, [string, any]>(
    Object.keys(inputs)
      .map((i) => resolveModuleVersion(resolve(buildPath, i), rootPath)!)
      .filter(Boolean)
      .map(([path, version, sideEffects]) => [path, [version, sideEffects]]),
  )

  return getAllPackagesVersions(getBuildEnv().pwd, modulesMap)
}

export const esbuildResult2Stats = (
  esbuildResult: BuildResult,
  options: BuildOptions & { originWorkingDir?: string },
): PerfseeReportStats => {
  const { errors, warnings, metafile } = esbuildResult
  const { entryPoints = {}, publicPath = '/', absWorkingDir = process.cwd(), originWorkingDir } = options
  const outputPath = getOutputPath(options)

  if (!metafile) {
    throw new Error('Metafile not found')
  }

  const { outputs, inputs } = metafile

  const outputAssetEntries = Object.entries(outputs).filter(([path]) => !isSourceMap(path))
  const outputAssetAsChunk = outputAssetEntries.filter(
    // @ts-expect-error
    ([name, { intermediate }]) => [AssetTypeEnum.Js].includes(detectFileType(name)) && !intermediate,
  )

  const chunkMap = initChunkMap(outputAssetAsChunk, options)
  const moduleMap = initModuleMap(inputs)

  // analyze module references
  Object.entries(inputs).forEach(([name, { imports }]) => {
    const module = moduleMap.get(name)
    if (module) {
      imports.forEach(({ path, kind }) => {
        const importModule = moduleMap.get(path)
        if (importModule) {
          importModule.issuerName = name
          importModule.reasons ||= []
          importModule.reasons.push({
            module: module.name,
            moduleName: module.name,
            moduleId: module.id,
            type: kind as any,
            moduleIdentifier: module.name,
            loc: '',
            userRequest: '',
          })
        }
      })
    }
  })

  outputAssetAsChunk.forEach(([output, outputValue]) => {
    const { inputs, imports } = outputValue
    const chunkName = getChunkName(output)
    const chunk = chunkMap.get(chunkName)

    if (!chunk) {
      return
    }

    // analyze chunk references
    imports.forEach(({ path, kind }) => {
      const childChunk = chunkMap.get(getChunkName(path))
      if (childChunk) {
        childChunk.initial = kind !== 'dynamic-import'
        chunk.children.push(childChunk.id as number)
      }
    })

    // analyze module&chunk references
    Object.keys(inputs).forEach((input) => {
      const module = moduleMap.get(input)
      if (module) {
        chunk.modules?.push(module)
        module.chunks.includes(chunk.id) || module.chunks.push(chunk.id)
      }
    })

    chunk.files.push(...findAssets(outputValue, outputs).map((path) => pathToName(path, options)))
  })

  const entrypoints = Object.fromEntries(
    (Array.isArray(entryPoints) ? entryPoints.map((ep) => [ep, ep]) : Object.entries(entryPoints))
      .map(([entryName, entry]) => {
        const chunks = recursivelyFindEntryChunkIds(
          outputAssetEntries.find(
            ([, { entryPoint }]) => entryPoint && fileMatch(entryPoint, entry, originWorkingDir ?? absWorkingDir),
          )?.[0],
          outputs,
        )
          .map((path) => chunkMap.get(getChunkName(path)))
          .filter(Boolean)

        return [
          entryName,
          {
            name: entryName,
            chunks: chunks.map((ck) => ck?.id),
            childAssets: {},
            children: {},
            assets: union(...chunks.map((ck) => ck?.files)),
          } as BundleChunkGroup,
        ]
      })
      .filter(Boolean),
  )

  const assetsByChunkName = Object.fromEntries([...chunkMap.entries()].map(([name, { files }]) => [name, files]))

  return {
    packageVersions: resolveModulesVersion(metafile, getBuildEnv().pwd, process.cwd()),
    repoPath: getBuildEnv().pwd,
    buildPath: process.cwd(),
    publicPath,
    outputPath,
    _showErrors: errors.length > 0,
    _showWarnings: warnings.length > 0,
    assetsByChunkName,
    assets: outputAssetEntries.map(([path, { bytes }]) => {
      const chunks = Object.entries(assetsByChunkName)
        .filter(([, assets]) => assets.includes(pathToName(path, options)))
        .map(([chunkName]) => chunkMap.get(chunkName))
        .filter(Boolean) as Chunk[]
      return {
        name: pathToName(path, options),
        size: bytes,
        emitted: false,
        chunkNames: chunks.flatMap((chunk) => chunk?.names),
        chunks: chunks.map((chunk) => chunk.id),
        path,
      }
    }),
    chunks: [...chunkMap.values()],
    errors: errors.map((error) => error.detail),
    warnings: warnings.map((warning) => warning.detail),
    entrypoints,
    buildTool: BundleToolkit.Esbuild,
    metafile,
    buildOptions: serializeBundlerOptions(options),
  }
}
