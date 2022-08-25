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

import { BundleToolkit, PerfseeReportStats } from '../../stats'

import { parseAssetModules as parseWebpackAssetModules } from './asset-parser-webpack'

export const assetModulesParser: {
  [T in BundleToolkit]: (
    contnet: string,
    path: string,
    stats: PerfseeReportStats,
  ) => Map</* module id */ string | number, /* content or length */ string | number>
} = {
  [BundleToolkit.Webpack]: parseWebpackAssetModules,
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
