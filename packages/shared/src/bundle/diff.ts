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

import { keyBy, sortBy, uniq, pick } from 'lodash'

import {
  Asset,
  AssetTypeEnum,
  BasePackage,
  BundleAuditResult,
  BundleResult,
  Chunk,
  DuplicatePackage,
  EntryPoint,
  NoteType,
  PackageAppendix,
  Size,
} from '../types'

import { addSize, getDefaultSize } from './size'

export interface Diff<T = Size> {
  current: T
  baseline?: T | null
}

export type AssetInfo = Omit<Asset, 'packages'> & {
  initial: boolean
  intermediate?: boolean
  packages: Array<string | { path: string; size: Size; name: string; version?: string; ref: number }>
}

export type PackageInfo = Omit<BasePackage & PackageAppendix, 'issuerRefs' | 'notes'> & {
  issuers: string[]
  notes?: string[]
  issuerRefs: number[]
}

export function parseResult(job: BundleResult) {
  const assetsMap = new Map(job.assets.map((asset) => [asset.ref, asset]))
  const chunksMap = new Map(job.chunks.map((chunk) => [chunk.ref, chunk]))
  const packagesMap = new Map(job.packages?.map((pkg) => [pkg.ref, pkg]))

  const stringifyNote = (note: NoteType) => {
    if (note.type === 'concat' && packagesMap.has(note.targetRef)) {
      return `concatenated in ${packagesMap.get(note.targetRef)!.path}`
    }
    return ''
  }

  const entryPoints = job.entryPoints.map((entry) => {
    const assets = entry.assetRefs.map((ref) => assetsMap.get(ref)!)
    const chunks = entry.chunkRefs.map((ref) => chunksMap.get(ref)!)

    const packages: Array<PackageInfo> = entry.packageAppendixes.map((appendix) =>
      Object.assign({}, packagesMap.get(appendix.ref)!, appendix, {
        issuers: appendix.issuerRefs.map((ref) => packagesMap.get(ref)?.path).filter(Boolean) as string[],
        notes: appendix.notes.map((note) => stringifyNote(note)).filter(Boolean) as string[],
      }),
    )

    let duplicatedPackages: DuplicatePackage[] = []

    if (entry.audits) {
      const audit = entry.audits.find((audit) => audit.id === 'duplicate-libraries')
      if (audit && audit.detail?.type === 'table' && audit.detail?.items) {
        duplicatedPackages = audit.detail?.items as DuplicatePackage[]
      }
    }

    const initialAssetRefs = uniq(entry.initialChunkRefs.map((ref) => chunksMap.get(ref)!.assetRefs).flat())

    return {
      name: entry.name,
      score: entry.score,
      size: entry.size,
      initialSize: entry.initialSize,
      assets: assets.map((asset) =>
        Object.assign({}, asset, {
          initial: initialAssetRefs.includes(asset.ref),
          intermediate: (asset as any).intermediate,
          packages: asset.packageRefs
            .map(({ ref, size }) => {
              const pkg = packagesMap.get(ref)
              // case: Some assets refer a non-existing pkg
              if (!pkg) {
                return null!
              }

              return {
                path: size.raw === 0 ? `(concatenated) ${pkg.path}` : pkg.path,
                size,
                name: pkg.name,
                version: pkg.version,
                ref,
              }
            })
            .filter(Boolean),
        }),
      ),
      chunks,
      packages,
      duplicatedPackages,
      initialAssets: initialAssetRefs.map((ref) => ({ ...assetsMap.get(ref)!, initial: true })) as AssetInfo[],
      // entry.audits may be readonly
      audits: sortBy(entry.audits, (a) => a.score),
    }
  })

  return {
    entryPoints,
    assetsMap,
    chunksMap,
    packagesMap,
  }
}

export interface EntryDiffBrief {
  assetsCountDiff: Diff<number>
  sizeDiff: Diff
  initialSizeDiff: Diff
  initialJsSizeDiff: Diff
  initialCssSizeDiff: Diff
  jsSizeDiff: Diff
  cssSizeDiff: Diff
  cacheInvalidation: Diff
  chunksCountDiff: Diff<number>
  packagesCountDiff: Diff<number>
  duplicatedPackagesCountDiff: Diff<number>
  score: Diff<number | undefined>
}

export interface EntryDiff extends EntryDiffBrief {
  assetsDiff: Diff<AssetInfo[]>
  initialAssetsDiff: Diff<AssetInfo[]>
  chunksDiff: Diff<Chunk[]>
  packagesDiff: Diff<PackageInfo[]>
  duplicatedPackages: Diff<DuplicatePackage[]>
  packageIssueMap: PackageIssueMap
  audits: Diff<BundleAuditResult[]>
}

export function briefEntryDiff(entryDiff: EntryDiff): EntryDiffBrief {
  return pick(
    entryDiff,
    'assetsCountDiff',
    'sizeDiff',
    'initialSizeDiff',
    'initialJsSizeDiff',
    'initialCssSizeDiff',
    'jsSizeDiff',
    'cssSizeDiff',
    'cacheInvalidation',
    'chunksCountDiff',
    'packagesCountDiff',
    'duplicatedPackagesCountDiff',
    'score',
  )
}

export interface BundleDiff {
  [key: string]: EntryDiff
}

export interface VersionBundleDiffResult {
  entryPoints: EntryPoint[]
  packages: number
  size: Size
  assets: number
  invalidCache: Size | null
}

interface PackageWithSize extends BasePackage {
  size: Size
  assetsRef: number[]
}

export interface PackageStruct extends PackageWithSize {
  children: PackageStruct[]
}

export type PackageIssueMap = Record<
  number,
  {
    ref: number
    issuerRefs: number[]
    name: string
    version?: string
  }
>

function calculateTotalSize(assets: AssetInfo[] | undefined, type?: AssetTypeEnum) {
  if (!assets) {
    return null
  }

  return assets
    .filter((asset) => (!type || asset.type === type) && !asset.intermediate)
    .reduce((size, asset) => addSize(size, asset.size), getDefaultSize())
}

export function diffBundleResult(job: BundleResult, base?: BundleResult | null): BundleDiff {
  const jobResult = parseResult(job)
  const baseResult = base ? parseResult(base) : { entryPoints: [] }

  const result: BundleDiff = {}

  jobResult.entryPoints.forEach((entryPoint) => {
    const baseEntryPoint = baseResult.entryPoints.find((baseEntryPoint) => baseEntryPoint.name === entryPoint.name)

    const jsDiff = {
      total: {
        current: calculateTotalSize(entryPoint.assets, AssetTypeEnum.Js)!,
        baseline: calculateTotalSize(baseEntryPoint?.assets, AssetTypeEnum.Js),
      },
      initial: {
        current: calculateTotalSize(entryPoint.initialAssets, AssetTypeEnum.Js)!,
        baseline: calculateTotalSize(baseEntryPoint?.initialAssets, AssetTypeEnum.Js),
      },
    }

    const cssDiff = {
      total: {
        current: calculateTotalSize(entryPoint.assets, AssetTypeEnum.Css)!,
        baseline: calculateTotalSize(baseEntryPoint?.assets, AssetTypeEnum.Css),
      },
      initial: {
        current: calculateTotalSize(entryPoint.initialAssets, AssetTypeEnum.Css)!,
        baseline: calculateTotalSize(baseEntryPoint?.initialAssets, AssetTypeEnum.Css),
      },
    }

    const assetSizeDiff = {
      current: entryPoint.size,
      baseline: baseEntryPoint?.size,
    }

    const baseAssetNames = new Set<string>(baseEntryPoint?.assets.map(({ name }) => name))
    const cacheInvalidation: Diff = {
      current: baseEntryPoint
        ? calculateTotalSize(entryPoint.assets.filter((asset) => !baseAssetNames.has(asset.name)))!
        : getDefaultSize(),
      baseline: null,
    }

    result[entryPoint.name] = {
      assetsDiff: {
        current: entryPoint.assets,
        baseline: baseEntryPoint?.assets ?? null,
      },
      assetSizeDiff,
      sizeDiff: {
        current: entryPoint.size,
        baseline: baseEntryPoint?.size ?? null,
      },
      initialSizeDiff: {
        current: entryPoint.initialSize,
        baseline: baseEntryPoint?.initialSize ?? null,
      },
      initialAssetsDiff: {
        current: entryPoint.initialAssets,
        baseline: baseEntryPoint?.initialAssets ?? null,
      },
      initialJsSizeDiff: jsDiff.initial,
      initialCssSizeDiff: cssDiff.initial,
      jsSizeDiff: jsDiff.total,
      cssSizeDiff: cssDiff.total,
      chunksDiff: {
        current: entryPoint.chunks,
        baseline: baseEntryPoint?.chunks ?? null,
      },
      packagesDiff: {
        current: entryPoint.packages,
        baseline: baseEntryPoint?.packages ?? null,
      },
      cacheInvalidation,
      chunksCountDiff: {
        current: entryPoint.chunks.length,
        baseline: baseEntryPoint?.chunks.length ?? null,
      },
      assetsCountDiff: {
        current: entryPoint.assets.length,
        baseline: baseEntryPoint?.assets.length ?? null,
      },
      packagesCountDiff: {
        current: entryPoint.packages.length,
        baseline: baseEntryPoint?.packages.length ?? null,
      },
      duplicatedPackagesCountDiff: {
        current: Object.keys(entryPoint.duplicatedPackages).length,
        baseline: Object.keys(baseEntryPoint?.duplicatedPackages ?? {}).length,
      },
      duplicatedPackages: {
        current: entryPoint.duplicatedPackages,
        baseline: baseEntryPoint?.duplicatedPackages ?? null,
      },
      audits: {
        current: entryPoint.audits,
        baseline: baseEntryPoint?.audits ?? null,
      },
      packageIssueMap: generatePackageIssueMap(entryPoint.packages),
      score: {
        current: entryPoint.score,
        baseline: baseEntryPoint?.score,
      },
    }
  })

  return result
}

function generatePackageIssueMap(packages: PackageInfo[]) {
  const result: PackageIssueMap = {}

  packages.forEach(({ ref, name, issuerRefs, version }) => {
    result[ref] = {
      ref,
      name,
      issuerRefs,
      version,
    }
  })

  return result
}

const generatePackage = (
  refs: number[],
  includesMap: Map<number, number[]>,
  packageMap: Record<number, PackageWithSize>,
): PackageStruct[] => {
  if (!refs.length) {
    return []
  }

  return refs
    .map((ref) => {
      const childrenPackages = includesMap.get(ref) ?? []
      const children = generatePackage(childrenPackages, includesMap, packageMap)
      const pkg = packageMap[ref]

      return {
        ...pkg,
        children,
        value: pkg.size.raw,
      }
    })
    .sort((left, right) => right.size.raw - left.size.raw)
}

export const analysisPackages = (job: BundleResult) => {
  const { entryPoints, packages, assets } = job
  const reverseMap = new Map<number, number[]>()
  const includesMap = new Map<number, number[]>()
  const assetsRefList: number[] = []

  if (!packages) {
    return []
  }

  const packagesMap: Record<number, PackageWithSize> = keyBy(
    packages.map((pkg) => ({ ...pkg, size: getDefaultSize(), assetsRef: [] })),
    'ref',
  )
  const assetsMap: Record<number, Asset> = keyBy(assets, 'ref')

  entryPoints.forEach(({ packageAppendixes, assetRefs }) => {
    assetsRefList.push(...assetRefs)
    packageAppendixes.forEach((appendix) => {
      const { ref, issuerRefs } = appendix
      const raw = reverseMap.get(ref) ?? []
      reverseMap.set(ref, [...raw, ...issuerRefs])

      issuerRefs.forEach((issuerRef) => {
        const rawIncludes = includesMap.get(issuerRef) ?? []
        includesMap.set(issuerRef, [...rawIncludes, ref])
      })
    })
  })

  uniq(assetsRefList).forEach((assetRef) => {
    const asset = assetsMap[assetRef]

    if (asset?.packageRefs?.length) {
      asset.packageRefs.forEach((packageRef) => {
        const { ref, size } = packageRef
        packagesMap[ref].size = addSize(packagesMap[ref].size, size)
        packagesMap[ref].assetsRef = [...(packagesMap[ref].assetsRef ?? []), asset.ref]
      })
    }
  })

  const firstLevel: number[] = []
  reverseMap.forEach((value, key) => {
    if (!value.length) {
      firstLevel.push(key)
    }
  })

  return generatePackage(firstLevel, includesMap, packagesMap)
}
