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

import { PerfseeReportStats, ID, ModuleReasonType } from '../stats'
import {
  Asset as AcquiredAsset,
  Chunk as AcquiredChunk,
  BasePackage,
  PackageAppendix,
  BundleAuditResult,
  Size,
} from '../types'

export * from '../types'

export enum LogLevel {
  verbose,
  info,
  warn,
  error,
}

export type Logger = {
  [Key in keyof typeof LogLevel]: Key extends number ? never : (message: string, data?: any) => void
}

export interface PackageMeta {
  name: string
  path: string
}

export type Asset = AcquiredAsset & {
  modules: Module[]
  content?: string
  intermediate?: boolean
  sourcemap?: boolean
}

export type Chunk = Omit<AcquiredChunk, 'assetRefs'> & {
  id: ID
  children: ID[]
  modules: Module[]
  assets: Asset[]
  names: string[]
  reason: string
}

type AcquiredPackage = BasePackage & PackageAppendix

export type Issuer = PackageMeta & {
  type: ModuleReasonType
}

export type Package = Omit<AcquiredPackage, 'assetRefs' | 'issuerRefs'> & {
  issuers: Issuer[]
  assets: Asset[]
  ignored: boolean
}

export type Module = Package & {
  id: ID
  concatenating: Module[]
  realPath: string
}

export type AuditParam = {
  assets: Asset[]
  chunks: Chunk[]
  packages: Package[]
  size: Size
  stats: PerfseeReportStats
}

export type Audit = {
  (param: Readonly<AuditParam>): BundleAuditResult | BundleAuditResult[]
}
