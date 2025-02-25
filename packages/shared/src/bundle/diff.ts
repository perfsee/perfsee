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

import { keyBy, sortBy, uniq, pick, uniqBy } from 'lodash'

import { ArtifactQuery } from '@perfsee/schema'

import {
  Asset,
  AssetTypeEnum,
  BasePackage,
  BundleAuditResult,
  BundleAuditWarning,
  BundleResult,
  Chunk,
  DuplicatePackage,
  EntryPoint,
  ModuleTreeNode,
  NoteType,
  PackageAppendix,
  Size,
} from '../types'

import { assetsMatcher } from './matcher'
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

export type BundleJobEntryPoint = EntryDiffBrief & {
  name: string
  warnings: BundleAuditWarning[]
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

export function generateEntryPoints(
  jobResult: BundleResult,
  baselineResult?: BundleResult | null,
): Record<string, BundleJobEntryPoint> {
  const diffResult = diffBundleResult(jobResult, baselineResult)

  const result: Record<string, BundleJobEntryPoint> = {}

  for (const entryPointName in diffResult) {
    const entryPoint = briefEntryDiff(diffResult[entryPointName])
    const warnings = generateWarnings(
      jobResult.entryPoints.find(({ name }) => name === entryPointName)!,
      baselineResult?.entryPoints?.find(({ name }) => name === entryPointName),
    )
    result[entryPointName] = {
      ...entryPoint,
      name: entryPointName,
      warnings,
    }
  }

  return result
}

export function generateWarnings(entryPoint: EntryPoint, baseline?: EntryPoint | null): BundleAuditWarning[] {
  const baselineScoreMap = new Map(baseline?.audits?.map((audit) => [audit.id, audit.numericScore?.value]))
  const entryPointWarnings: BundleAuditWarning[] = []
  entryPoint.audits?.forEach((audit) => {
    if (!audit.numericScore) {
      return
    }

    const baselineScore = baselineScoreMap.get(audit.id)
    const score = audit.numericScore.value
    const throttle =
      baselineScore && audit.numericScore.relativeWarningThrottle
        ? baselineScore - audit.numericScore.relativeWarningThrottle
        : audit.numericScore.absoluteWarningThrottle

    if (score < throttle) {
      entryPointWarnings.push({
        rule: audit.title,
        score: score.toFixed(2),
        throttle: `< ${throttle.toFixed(2)}`,
      })
    }
  })

  return entryPointWarnings
}

export function calculateJobTotalSize(jobResult: BundleResult): Size {
  return jobResult.assets.reduce((total, asset) => {
    return addSize(total, asset.size)
  }, getDefaultSize())
}

function getBaseModuleName(name: string): string {
  return name.split(' + ')[0].replaceAll(/@\d+\.\d+\.\d+(?:[-_].+?)?/g, '')
}

function splitNestedFolders(node: ModuleTreeNode, isTopLevel = true): ModuleTreeNode {
  const baseName = getBaseModuleName(node.name)

  if (!baseName.includes('/') || isTopLevel) {
    return {
      ...node,
      children: node.children?.map((child) => splitNestedFolders(child, false)),
    }
  }

  const parts = baseName.split('/')
  const concatenatedSuffix = node.name.includes(' + ') ? node.name.slice(node.name.indexOf(' + ')) : ''

  let currentNode: ModuleTreeNode = {
    name: parts[0],
    value: node.value,
    gzip: node.gzip,
    brotli: node.brotli,
    children: [],
  }

  const result = currentNode

  for (let i = 1; i < parts.length - 1; i++) {
    const newNode: ModuleTreeNode = {
      name: parts[i],
      value: node.value,
      gzip: node.gzip,
      brotli: node.brotli,
      children: [],
    }
    currentNode.children!.push(newNode)
    currentNode = newNode
  }

  const lastNode: ModuleTreeNode = {
    ...node,
    name: parts[parts.length - 1] + concatenatedSuffix,
    children: node.children?.map((child) => splitNestedFolders(child, false)),
  }

  currentNode.children!.push(lastNode)

  return result
}

function mergeNestedFolders(node: ModuleTreeNode, isTopLevel = true): ModuleTreeNode {
  if (!node.children || node.children.length === 0) {
    return node
  }

  let processedData = {
    ...node,
    children: node.children.map((child) => mergeNestedFolders(child, false)),
  }

  if (isTopLevel) {
    return processedData
  }

  while (processedData.children && processedData.children.length === 1 && processedData.children[0].children) {
    const onlyChild = processedData.children[0]
    const baseName = getBaseModuleName(processedData.name)
    const childBaseName = getBaseModuleName(onlyChild.name)
    const concatenatedSuffix = onlyChild.name.includes(' + ') ? onlyChild.name.slice(onlyChild.name.indexOf(' + ')) : ''

    processedData = {
      ...processedData,
      name: `${baseName}/${childBaseName}${concatenatedSuffix}`,
      children: onlyChild.children || [],
      value: processedData.value,
      gzip: processedData.gzip,
      brotli: processedData.brotli,
      ...(processedData.modules && { modules: processedData.modules }),
      ...(processedData.concatenated && { concatenated: processedData.concatenated }),
      ...(processedData.entryPoints && { entryPoints: processedData.entryPoints }),
      ...(processedData.dynamic && { dynamic: processedData.dynamic }),
      ...(processedData.unused && { unused: processedData.unused }),
      ...(processedData.esm && { esm: processedData.esm }),
      ...(processedData.sideEffects && { sideEffects: processedData.sideEffects }),
      ...(processedData.baseline && { baseline: processedData.baseline }),
    }
  }

  return processedData
}

function findMatchingNode(
  node: ModuleTreeNode,
  baselineNodes: ModuleTreeNode[],
  currentContent: ModuleTreeNode[],
  baselineContent: ModuleTreeNode[],
  diff: BundleDiff,
  currentPath: string[] = [],
  isTopLevel = true,
): ModuleTreeNode | undefined {
  if (isTopLevel && node.name.match(/\.m?js$/)) {
    currentPath = []
  }

  if (currentPath.length === 0 && node.name.match(/\.m?js$/) && isTopLevel) {
    const currentAssets = uniqBy(
      Object.values(diff)
        .map((entryDiff) => entryDiff.assetsDiff)
        .flatMap((assetsDiff) => assetsDiff.current),
      'name',
    )
    const baselineAssets = uniqBy(
      Object.values(diff)
        .map((entryDiff) => entryDiff.assetsDiff)
        .flatMap((assetsDiff) => assetsDiff.baseline || []),
      'name',
    )

    const currentAsset = currentAssets.find((a) => a.name === node.name)
    if (currentAsset) {
      const matchResult = assetsMatcher.findBestMatch(currentAsset, baselineAssets, currentContent, baselineContent)
      if (matchResult.baseline) {
        node.baseline = {
          name: matchResult.baseline.name,
          size: matchResult.baseline.size,
        }
        return baselineNodes.find((n) => n.name === matchResult.baseline?.name)
      }
    }
  }

  const currentName = getBaseModuleName(node.name)
  const nodePath = [...currentPath, currentName].join('/')

  const directMatch = baselineNodes.find((n) => {
    const baselineName = getBaseModuleName(n.name)
    const baselinePath = [...currentPath, baselineName].join('/')
    return (
      baselinePath === nodePath &&
      (!n.concatenated || !node.concatenated || getBaseModuleName(n.name) === getBaseModuleName(node.name))
    )
  })

  if (directMatch) {
    return directMatch
  }

  for (const baselineNode of baselineNodes) {
    if (baselineNode.children) {
      const baseNodeName = getBaseModuleName(baselineNode.name)
      const childMatch = findMatchingNode(
        node,
        baselineNode.children,
        currentContent,
        baselineContent,
        diff,
        [...currentPath, baseNodeName],
        false,
      )
      if (childMatch) {
        return childMatch
      }
    }
  }

  return undefined
}

export type Bundle = ArtifactQuery['project']['artifact']

export function diffBundleContent(
  currentBundle: Bundle | null,
  baselineBundle: Bundle | null,
  diff: BundleDiff,
  current: ModuleTreeNode[],
  baseline?: ModuleTreeNode[] | null,
  isTopLevel = true,
): ModuleTreeNode[] {
  if (!baseline || currentBundle?.name !== baselineBundle?.name) {
    return current
  }

  const splitCurrent = isTopLevel ? current.map((node) => splitNestedFolders(node)) : current
  const splitBaseline = isTopLevel ? baseline.map((node) => splitNestedFolders(node)) : baseline

  const processedNodes = splitCurrent.map((node) => {
    const baselineNode = findMatchingNode(node, splitBaseline, current, baseline, diff)

    const result: ModuleTreeNode = {
      ...node,
      baseline: baselineNode
        ? {
            size: { raw: baselineNode.value, gzip: baselineNode.gzip, brotli: baselineNode.brotli },
            name: isTopLevel ? baselineNode.name : undefined,
          }
        : null,
    }

    if (node.children) {
      result.children = diffBundleContent(
        currentBundle,
        baselineBundle,
        diff,
        node.children,
        baselineNode?.children || null,
        false,
      )
    }

    return result
  })

  return isTopLevel ? processedNodes.map((node) => mergeNestedFolders(node)) : processedNodes
}
