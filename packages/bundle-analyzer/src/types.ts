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

import { BundleToolkit } from './stats'

export interface Size {
  raw: number
  gzip: number
  brotli: number
}

export enum AssetTypeEnum {
  Js = 'js',
  Css = 'css',
  Image = 'image',
  Font = 'font',
  Html = 'html',
  Media = 'media',
  Other = 'other',
}

export interface Asset {
  ref: number
  name: string
  type: AssetTypeEnum
  size: Size
  path?: string
  packageRefs: Array<{ ref: number; size: Size }>
}

export interface Chunk {
  ref: number
  entry: boolean
  async: boolean
  assetRefs: number[]
}

export type NoteType = {
  type: 'concat'
  targetRef: number
}

export interface BasePackage {
  ref: number
  name: string
  path: string
  version?: string
}

export interface PackageAppendix {
  ref: number
  size: Size
  issuerRefs: number[]
  assetRefs: number[]
  notes: NoteType[]
}

export interface DuplicatePackage {
  name: string
  versions: string[]
}

type TableItemType = 'text' | 'size' | 'list' | 'link'

type TableDetail = {
  type: 'table'
  headings: { key: string; name: string; itemType: TableItemType }[]
  items: Record<string, any>[]
}

type ListDetail = {
  type: 'list'
  items: Array<string | number | boolean>
}

export type BundleAuditDetail = TableDetail | ListDetail

export enum BundleAuditScore {
  Bad,
  Warn,
  Notice,
  Good,
}

export interface BundleAuditResult {
  id: string
  title: string
  desc: string
  score: BundleAuditScore
  weight: number
  link?: string
  detail?: BundleAuditDetail
  numericScore?: {
    value: number
    absoluteWarningThrottle: number
    relativeWarningThrottle?: number
  }
}

export interface BundleAuditWarning {
  rule: string
  score: string
  throttle: string
}

export interface EntryPoint {
  name: string
  size: Size
  initialSize: Size
  chunkRefs: number[]
  initialChunkRefs: number[]
  assetRefs: number[]
  packageAppendixes: PackageAppendix[]
  audits: BundleAuditResult[]
  score?: number
}

export interface BundleResult {
  score?: number
  entryPoints: EntryPoint[]
  assets: Asset[]
  chunks: Chunk[]
  packages: BasePackage[]
  repoPath?: string
  buildPath?: string
  buildTool?: BundleToolkit
}

export interface ModuleMap {
  [moduleId: string]: { path: string; packageRef: number; concatenatingLength: number }
}

export interface ModuleTreeNodeUnit {
  label: string
  statSize: number
  parsedSize: number
  gzipSize: number
  inaccurateSizes?: boolean
  groups?: ModuleTreeNodeUnit[]
  concatenated?: boolean
  id?: string
  path?: string
  isAsset?: boolean
}

export interface ModuleTreeNode {
  name: string
  value: number
  gzip: number
  brotli: number
  children?: ModuleTreeNode[]
  modules?: string[]
  concatenated?: boolean
  entryPoints?: string[]
}
