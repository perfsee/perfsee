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

import { partition, union } from 'lodash'
import { OutputAsset, OutputBundle, OutputChunk, PluginContext } from 'rollup'

import { BundleModule, BundleToolkit, PerfseeReportStats } from '@perfsee/bundle-analyzer'
import { BUILD_ENV } from '@perfsee/plugin-utils'

import { recursivelyFindEntryChunks } from './util'

const isChunk = (output: OutputAsset | OutputChunk): output is OutputChunk => output.type === 'chunk'

let id = 0

export function rollupOutput2WebpackStats(this: PluginContext, outputBundle: OutputBundle): PerfseeReportStats {
  const [chunksEntries, assetsEntries] = partition(Object.entries(outputBundle), ([, bundle]) => isChunk(bundle)) as [
    Array<[string, OutputChunk]>,
    Array<[string, OutputAsset]>,
  ]

  const modulesMap = new Map<string, BundleModule>()

  const chunksMap = new Map(
    chunksEntries.map(([path, bundle]) => {
      const chunkId = id++
      return [
        path,
        {
          id: chunkId,
          children: [] as number[],
          entry: bundle.isEntry || bundle.isDynamicEntry,
          files: [bundle.fileName],
          initial: bundle.isEntry,
          parents: [] as number[],
          rendered: true,
          size: bundle.code.length,
          siblings: [],
          modules: Object.entries(bundle.modules)
            .filter(([id]) => {
              // Rollup convention, this id should be handled by the
              // plugin that marked it with \0
              return !id.startsWith('\0')
            })
            .map(([id, module]) => {
              const moduleInfo = this.getModuleInfo(id)
              const newModule = modulesMap.has(id)
                ? modulesMap.get(id)!
                : {
                    errors: 0,
                    built: true,
                    cacheable: true,
                    failed: false,
                    id,
                    index: 0,
                    index2: 0,
                    name: id,
                    identifier: id,
                    size: module.renderedLength,
                    optional: false,
                    prefetched: false,
                    reasons:
                      moduleInfo?.importers.map((importerId) => {
                        return {
                          module: importerId,
                          moduleName: importerId,
                          moduleId: importerId,
                          moduleIdentifier: importerId,
                          type: 'null' as any,
                          loc: '',
                          userRequest: '',
                        }
                      }) ?? [],
                    profile: null,
                    warnings: 0,
                    modules: [],
                    issuerPath: [],
                    issuerId: undefined,
                    issuer: undefined,
                    issuerName: undefined,
                    chunks: [] as number[],
                  }

              newModule.chunks.includes(chunkId) || newModule.chunks.push(chunkId)

              modulesMap.set(id, newModule)
              return newModule
            }),
          childrenByOrder: {},
          names: [bundle.fileName],
        },
      ]
    }),
  )

  const recursivelySetInitialChunks = ([path, chunk]: [string, OutputChunk], found = [path]) => {
    const currentChunk = chunksMap.get(path)
    if (!currentChunk || chunk.isDynamicEntry) return
    if (chunk.isEntry || currentChunk.initial) {
      const nextFound = union(found, chunk.imports)
      chunk.imports
        .filter((importPath) => !found.includes(importPath))
        .forEach((importPath) => {
          const importChunk = chunksMap.get(importPath)
          if (!importChunk) return
          importChunk.initial = true
          recursivelySetInitialChunks([importPath, outputBundle[importPath] as OutputChunk], nextFound)
        })
    }
  }

  chunksEntries.forEach(([path, chunk]) => {
    const currentChunk = chunksMap.get(path)
    recursivelySetInitialChunks([path, chunk])

    if (!currentChunk) return
    const allImports = chunk.imports
    allImports.forEach((importPath) => {
      const importChunk = chunksMap.get(importPath)
      if (!importChunk) return

      currentChunk.children.includes(importChunk.id) || currentChunk.children.push(importChunk.id)
      importChunk.parents.includes(currentChunk.id) || importChunk.parents.push(currentChunk.id)
    })

    currentChunk.files = union(
      currentChunk.files,
      allImports,
      assetsEntries.map(([path]) => path),
    )
  })

  const assetsByChunkName = Object.fromEntries([...chunksMap.entries()].map(([name, { files }]) => [name, files]))

  const entrypoints = Object.fromEntries(
    chunksEntries
      .filter(([, { isEntry }]) => isEntry)
      .map(([id, { name }]) => {
        const chunks = recursivelyFindEntryChunks(id, outputBundle)
          .map((path) => chunksMap.get(path))
          .filter(Boolean)

        return [
          name,
          {
            name,
            childAssets: {},
            children: {},
            chunks: chunks.map((chunk) => chunk!.id),
            assets: union(...chunks.map((ck) => ck?.files)),
          },
        ]
      }),
  )

  return {
    packageVersions: [],
    repoPath: BUILD_ENV.pwd,
    buildPath: process.cwd(),
    _showErrors: false,
    _showWarnings: false,
    errors: [],
    warnings: [],
    chunks: [...chunksMap.values()],
    buildTool: BundleToolkit.Rollup,
    assetsByChunkName,
    assets: Object.entries(outputBundle).map(([id, bundle]) => {
      const chunks = Object.entries(assetsByChunkName)
        .filter(([, assets]) => assets.includes(id))
        .map(([chunkName]) => chunksMap.get(chunkName)!)
        .filter(Boolean)
      return {
        name: id,
        size: isChunk(bundle) ? bundle.code.length : bundle.source.length,
        emitted: false,
        chunks: chunks.map((chunk) => chunk.id),
        chunkNames: chunks.flatMap((chunk) => chunk.names),
        path: id,
      }
    }),
    outputBundle: chunksEntries.reduce((all, [id, { modules }]) => ({ ...all, [id]: { modules } }), {}),
    entrypoints,
  }
}
