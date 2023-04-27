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
import { resolve, join, relative, dirname } from 'path'

import { BuildOptions, Metafile } from 'esbuild'
import { union } from 'lodash'

import { BundleModule } from '@perfsee/bundle-analyzer'

import { Chunk, Output } from './type'

export const getOutputPath = (buildOptions: BuildOptions) => {
  return buildOptions.outdir ?? (buildOptions.outfile && dirname(buildOptions.outfile)) ?? process.cwd()
}

export const pathToName = (path: string, esbuildOption: BuildOptions) =>
  relative(getOutputPath(esbuildOption), join(esbuildOption.absWorkingDir ?? process.cwd(), path))

export const isSourceMap = (name: string) => /\.map$/.test(name)

export const getChunkName = (name: string) => name
const getPath = (path: string, absWorkingDir: string) => {
  return ['', '.js', '.jsx', '.ts', '.tsx']
    .map((extension) => resolve(absWorkingDir, path.replace(/(\?.*)?(#.*)?$/, '') + extension))
    .find((file) => existsSync(file))
}

export const fileMatch = (fileA: string, fileB: string, absWorkingDir: string) => {
  if (fileA && fileA === fileB) {
    return true
  }

  // path without schema
  if (fileA && fileB && (fileA.split(':')[1] === fileB || fileA === fileB.split(':')[1])) {
    return true
  }
  const pathA = getPath(fileA, absWorkingDir)
  const pathB = getPath(fileB, absWorkingDir)

  return pathA && pathA === pathB
}

let id = 1
export const initChunkMap = (outputs: [string, Output][], esbuildOption: BuildOptions) => {
  return new Map<string, Chunk>(
    outputs.map(([name, { bytes }]) => [
      getChunkName(name),
      {
        id: id++,
        children: [],
        entry: false,
        files: [pathToName(name, esbuildOption)],
        childrenByOrder: {},
        initial: true,
        names: [getChunkName(name)],
        rendered: true,
        size: bytes,
        siblings: [],
        modules: [],
      } as Chunk,
    ]),
  )
}

export const initModuleMap = (inputs: Metafile['inputs']) => {
  return new Map<string, BundleModule>(
    Object.entries(inputs).map(([name, { bytes }]) => {
      return [
        name,
        {
          id: name,
          name,
          identifier: name,
          size: bytes,
          reasons: [],
          modules: [],
          issuerPath: [],
          issuerId: undefined,
          issuer: undefined,
          issuerName: undefined,
          chunks: [],
        } as BundleModule,
      ]
    }),
  )
}

export const recursivelyFindEntryChunkIds = (
  entryPath: string | undefined,
  outputs: Metafile['outputs'],
  found = [entryPath],
): string[] => {
  if (!entryPath) return []
  const chunk = outputs[entryPath]
  if (!chunk) return []

  const importPaths = chunk.imports.map(({ path }) => path)

  return [entryPath].concat(
    importPaths.flatMap((importPath) =>
      found.includes(importPath) ? [] : recursivelyFindEntryChunkIds(importPath, outputs, union(found, importPaths)),
    ),
  )
}
