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

import { BundleModule, BundleToolkit, PerfseeReportStats } from '../../stats'

import { parseAssetModules as parseWebpackAssetModules, parseModuleRequiredChunks } from './asset-parser-webpack'

const parseModules = (
  map: Map</* module id */ string | number, /* content or length */ string | number>,
  modules?: BundleModule[],
) => {
  modules?.forEach((module) => {
    module.size && map.set(module.id, module.size)
    parseModules(map, module.modules)
  })
}

export const assetModulesParser: {
  [T in BundleToolkit]: (
    contnet: string,
    path: string,
    stats: PerfseeReportStats,
  ) => Map</* module id */ string | number, /* content or length */ string | number>
} = {
  [BundleToolkit.Webpack]: parseWebpackAssetModules,
  [BundleToolkit.Rspack]: (content, name, stats) => {
    try {
      return parseWebpackAssetModules(content)
    } catch {
      const asset = stats.assets?.find((a) => a.name === name)
      const chunkId = asset?.chunks[0]
      if (chunkId) {
        const chunk = stats.chunks?.find((c) => c.id === chunkId)
        const result = new Map()
        parseModules(result, chunk?.modules)
        return result
      }
    }
    return new Map()
  },
  [BundleToolkit.Esbuild]: (_content, path, stats) => {
    return new Map(
      Object.entries(stats.metafile!.outputs[path].inputs).map(([name, { bytesInOutput }]) => [name, bytesInOutput]),
    )
  },
  [BundleToolkit.Rollup]: (_content, path, stats) => {
    return new Map(
      Object.entries(stats.outputBundle?.[path].modules ?? []).map(([name, { code, renderedLength }]) => [
        name,
        code ?? renderedLength,
      ]),
    )
  },
}

export { parseModuleRequiredChunks }
