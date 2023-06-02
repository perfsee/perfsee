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

import { IPackageJson } from 'package-json-type'

import { Summary } from './benchmark/internal/common-types'

type AllOptions = {
  customImports?: Array<string>
  splitCustomImports?: boolean
  debug?: boolean
  calcParse?: boolean
  esm?: boolean
  entryFilename?: string
  client?: 'npm' | 'yarn'
  limitConcurrency?: boolean
  networkConcurrency?: number
  additionalPackages?: Array<string>
  isLocal?: boolean
  installTimeout?: number
}

export type Minifier = 'esbuild' | 'terser'

export interface BenchmarkResult {
  profiles?: any[]
  /** @deprecated */
  profile?: any
  results: Summary[]
}

export type GetPackageStatsOptions = Pick<
  AllOptions,
  'client' | 'limitConcurrency' | 'networkConcurrency' | 'debug' | 'customImports' | 'installTimeout'
> & {
  minifier?: Minifier
}

export type PackOptions = GetPackageStatsOptions & {
  benchmarkPattern?: string | string[]
  benchmarkTimeout?: string
  target?: 'node' | 'browser'
}

export type PackageJson = IPackageJson

export interface PackageUploadParams {
  host: string
  namespace: string
  name: string
  packageName: string
  packageVersion: string
  description?: string
  keywords?: string
  projectId: string
  branch: string
  commitHash: string
  commitMessage?: string
  tag?: string
  appVersion?: string
  nodeVersion?: string
  author?: string
  pr?: {
    number: number
    baseHash: string
    headHash: string
  }
}

export enum LogLevel {
  verbose,
  info,
  warn,
  error,
}

export type Logger = {
  [Key in keyof typeof LogLevel]: Key extends number ? never : (message: string, data?: any) => void
}
