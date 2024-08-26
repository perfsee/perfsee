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

import { Reason } from './stats-parser/types'
import { ModuleSource } from './types'

export type ID = number | string

export const SOURCE_CODE_PATH = '(Source Code)'
export const WEBPACK_INTERNAL_PATH = '(Webpack Internal)'
export const OLD_SOURCE_CODE_PATH = '.'
export const OLD_WEBPACK_INTERNAL_PATH = '(webpack)'

export enum BundleToolkit {
  Webpack = 'webpack',
  Esbuild = 'esbuild',
  Rollup = 'rollup',
}

export interface BundleChunkGroup {
  assets: string[]
  chunks: Array<ID>
  children: Record<
    string,
    {
      assets: string[]
      chunks: Array<ID>
      name: string
    }
  >
  childAssets: Record<string, string[]>
}

export interface BundleAsset {
  name: string
  size: number
  emitted: boolean
  chunks: Array<ID>
  chunkNames: Array<string>
}

export const ModuleReasonTypes = [
  'amd define',
  'amd require array',
  'amd require context',
  'amd require',
  'cjs require context',
  'cjs require',
  'context element',
  'delegated exports',
  'delegated source',
  'dll entry',
  'accepted harmony modules',
  'harmony accept',
  'harmony export expression',
  'harmony export header',
  'harmony export imported specifier',
  'harmony export specifier',
  'harmony import specifier',
  'harmony side effect evaluation',
  'harmony init',
  'import() context development',
  'import() context production',
  'import() eager',
  'import() weak',
  'import()',
  'json exports',
  'loader',
  'module.hot.accept',
  'module.hot.decline',
  'multi entry',
  'null',
  'prefetch',
  'require.context',
  'require.ensure',
  'require.ensure item',
  'require.include',
  'require.resolve',
  'single entry',
  'wasm export import',
  'wasm import',
  'new URL()',
  'cjs export require',
  'cjs self exports reference',
  'module decorator',
] as const

export const dynamicModuleReasonTypes = [
  'import() context development',
  'import() context production',
  'import() eager',
  'import() weak',
  'import()',
  'prefetch',
  'require.ensure',
  'require.ensure item',
  'amd require array',
  'amd require context',
  'amd require',
  'module.hot.accept',
]

export type ModuleReasonType = typeof ModuleReasonTypes[number]

export interface ModuleReason {
  moduleId: ID | null
  moduleIdentifier: string | null
  module: string | null
  moduleName: string | null
  resolvedModule?: string
  type: ModuleReasonType
  explanation?: string
  userRequest: string
  loc: string
}

export interface BundleModule {
  assets?: string[]
  chunks: Array<ID>
  size?: number
  id: ID
  identifier: string
  issuer: string | undefined
  issuerId: ID | undefined
  issuerName: string | undefined
  issuerPath: Array<{
    id: ID
    identifier: string
    name: string
  }>
  modules: BundleModule[]
  name: string
  nameForCondition?: string
  providedExports?: string[]
  reasons: ModuleReason[]
  usedExports?: boolean | string[]
  source?: string
  optimizationBailout?: string[]
}

export interface BundleChunk {
  id: ID
  entry: boolean
  initial: boolean
  children: number[]
  files: string[]
  auxiliaryFiles?: string[]
  modules?: BundleModule[]
  names: string[]
  origins?: Array<{
    moduleId?: ID
    module: string
    moduleName: string
    request: string
    reasons: string[]
  }>
  reason?: string
  rendered: boolean
  size: number
  siblings: number[]
}

export interface WebpackStats {
  outputPath?: string
  publicPath?: string
  hash?: string
  version?: string
  entrypoints?: Record<string, BundleChunkGroup>
  assets?: BundleAsset[]
  chunks?: BundleChunk[]
}

export type EsbuildImportKind =
  | 'entry-point'

  // JS
  | 'import-statement'
  | 'require-call'
  | 'dynamic-import'
  | 'require-resolve'

  // CSS
  | 'import-rule'
  | 'url-token'

export interface ESBuildMetafile {
  inputs: {
    [path: string]: {
      bytes: number
      imports: {
        path: string
        kind: EsbuildImportKind
      }[]
    }
  }
  outputs: {
    [path: string]: {
      bytes: number
      inputs: {
        [path: string]: {
          bytesInOutput: number
        }
      }
      imports: {
        path: string
        kind: EsbuildImportKind | 'file-loader'
      }[]
      exports: string[]
      entryPoint?: string
    }
  }
}

export interface RollupRenderedModule {
  code: string | null
  originalLength: number
  removedExports: string[]
  renderedExports: string[]
  renderedLength: number
}

export interface ModuleReasons {
  moduleReasons?: Record<number, Reason[]>
  moduleSource?: ModuleSource
  packageReasons?: Record<number, Reason[][]>
  sideEffects?: Record<number, Reason[]>
}

export interface PerfseeReportStats extends WebpackStats {
  packageVersions?: { name: string; version: string; sideEffects?: boolean | string[] | 'implicitly' }[]
  repoPath?: string
  buildPath?: string
  buildTool?: BundleToolkit
  metafile?: ESBuildMetafile
  outputBundle?: Record<
    string,
    {
      modules: Record<string, RollupRenderedModule>
    }
  >
  rules?: string[]
  includeAuxiliary?: boolean
  htmlExclusive?: boolean
  moduleReasons?: ModuleReasons
  strictChunkRelations?: boolean
}
