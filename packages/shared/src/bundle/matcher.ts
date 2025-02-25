import { ModuleTreeNode, Size } from '@perfsee/bundle-analyzer'

import { AssetInfo } from './diff'

interface AssetMatch {
  current: AssetInfo
  baseline?: AssetInfo | null
  score: number
}

type PackageInfo = { path: string; size: Size; name: string; version?: string; ref: number }

function getBaseModuleName(name: string): string {
  return name.split(' + ')[0].replaceAll(/@\d+\.\d+\.\d+(?:[-_].+?)?/g, '')
}

export class AssetsMatcher {
  private readonly similarityCache = new Map<string, number>()
  private readonly contentSimilarityCache = new Map<string, number>()
  private readonly bestMatchCache = new Map<string, AssetMatch>()
  private readonly treeSimilarityCache = new Map<string, number>()

  findBestMatch(
    current: AssetInfo,
    baselineAssets: AssetInfo[],
    currentContent?: ModuleTreeNode[],
    baselineContent?: ModuleTreeNode[],
    threshold = 50,
  ): AssetMatch {
    const cacheKey = this.getBestMatchCacheKey(
      current.name,
      baselineAssets.map((asset) => asset.name),
    )
    const cached = this.bestMatchCache.get(cacheKey)
    if (cached) {
      return {
        current: cached.current,
        baseline: cached.baseline,
        score: cached.score,
      }
    }

    const quickMatch = this.findQuickMatch(current, baselineAssets)
    if (quickMatch && quickMatch.score > 80) {
      return quickMatch
    }

    let bestMatch: AssetMatch = quickMatch || {
      current,
      baseline: null,
      score: 0,
    }

    if (currentContent && baselineContent) {
      bestMatch = {
        current,
        baseline: null,
        score: 0,
      }

      const potentialMatches = this.findPotentialMatches(current, baselineAssets)

      for (const baselineAsset of potentialMatches) {
        const score = this.calculateFullMatchScore(current, baselineAsset, currentContent, baselineContent)

        if (score > bestMatch.score) {
          bestMatch = {
            current,
            baseline: baselineAsset,
            score,
          }
        }
      }
    }

    if (bestMatch.score < threshold) {
      bestMatch.baseline = null
      bestMatch.score = 0
    }

    if (currentContent && baselineContent) {
      this.bestMatchCache.set(cacheKey, {
        current: bestMatch.current,
        baseline: bestMatch.baseline,
        score: bestMatch.score,
      })
    }

    return bestMatch
  }

  clearCache() {
    this.similarityCache.clear()
    this.contentSimilarityCache.clear()
    this.bestMatchCache.clear()
    this.treeSimilarityCache.clear()
  }

  private calculateFullMatchScore(
    current: AssetInfo,
    baseline: AssetInfo,
    currentContent?: ModuleTreeNode[],
    baselineContent?: ModuleTreeNode[],
  ): number {
    let score = 0
    const currentParts = this.parseFileName(current.name)
    const baselineParts = this.parseFileName(baseline.name)

    if (currentParts.path === baselineParts.path) {
      if (currentParts.nameWithoutHash === baselineParts.nameWithoutHash) {
        score += 30
      } else if (currentParts.isHashOnly && baselineParts.isHashOnly) {
        score += 20
      }
    }

    const sizeDiff = Math.abs(current.size.raw - baseline.size.raw)
    const maxSize = Math.max(current.size.raw, baseline.size.raw)
    const sizeRatio = maxSize > 0 ? 1 - sizeDiff / maxSize : 1
    score += sizeRatio * 10

    const packageScore = this.calculatePackageSimilarity(
      // @ts-expect-error
      current.packages.filter((p) => typeof p === 'object'),
      baseline.packages.filter((p) => typeof p === 'object'),
    )
    score += packageScore * 20

    if (currentContent && baselineContent) {
      const contentScore = this.calculateContentSimilarity(current.name, baseline.name, currentContent, baselineContent)
      score += contentScore * 60
    }

    return score
  }

  private findQuickMatch(current: AssetInfo, baselineAssets: AssetInfo[]): AssetMatch | null {
    let bestMatch: AssetMatch = {
      current,
      baseline: null,
      score: 0,
    }

    for (const baseline of baselineAssets) {
      const score = this.calculateMatchScore(current, baseline)
      if (score > bestMatch.score) {
        bestMatch = {
          current,
          baseline,
          score,
        }
      }
    }

    return bestMatch
  }

  private calculateQuickScore(current: AssetInfo, baseline: AssetInfo): number {
    let score = 0

    const currentParts = this.parseFileName(current.name)
    const baselineParts = this.parseFileName(baseline.name)

    if (currentParts.path === baselineParts.path) {
      if (currentParts.nameWithoutHash === baselineParts.nameWithoutHash) {
        score += 50
      } else if (currentParts.isHashOnly && baselineParts.isHashOnly) {
        score += 35
      } else {
        score += 20
      }
    }

    const sizeDiff = Math.abs(current.size.raw - baseline.size.raw)
    const maxSize = Math.max(current.size.raw, baseline.size.raw)
    const sizeRatio = maxSize > 0 ? 1 - sizeDiff / maxSize : 1

    if (sizeRatio > 0.9) {
      score += 30
    } else if (sizeRatio > 0.7) {
      score += 20
    } else if (sizeRatio > 0.5) {
      score += 10
    }

    if (current.initial === baseline.initial) {
      score += 10
    }

    const currentMainPkgs = current.packages
      .filter((p): p is PackageInfo => typeof p === 'object')
      .sort((a, b) => b.size.raw - a.size.raw)
      .slice(0, 3)

    const baselineMainPkgs = baseline.packages
      .filter((p): p is PackageInfo => typeof p === 'object')
      .sort((a, b) => b.size.raw - a.size.raw)
      .slice(0, 3)

    const currentPkgNames = new Set(currentMainPkgs.map((p) => p.name))
    const baselinePkgNames = new Set(baselineMainPkgs.map((p) => p.name))

    const commonPkgs = [...currentPkgNames].filter((name) => baselinePkgNames.has(name))
    if (commonPkgs.length > 0) {
      score += 10 * (commonPkgs.length / Math.max(currentPkgNames.size, baselinePkgNames.size))
    }

    return score
  }

  private findPotentialMatches(current: AssetInfo, baselineAssets: AssetInfo[]): AssetInfo[] {
    return baselineAssets
      .map((asset) => ({
        asset,
        score: this.calculateQuickScore(current, asset),
      }))
      .filter((item) => item.score > 30)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.asset)
  }

  private getBestMatchCacheKey(currentName: string, baselineNames: string[]): string {
    return `${currentName}::${baselineNames.sort().join('|')}`
  }

  private calculateContentSimilarity(
    currentAssetName: string,
    baselineAssetName: string,
    currentContent: ModuleTreeNode[],
    baselineContent: ModuleTreeNode[],
  ): number {
    const cacheKey = `${currentAssetName}::${baselineAssetName}`
    const cached = this.contentSimilarityCache.get(cacheKey)
    if (cached !== undefined) return cached

    const currentNode = this.findAssetNode(currentContent, currentAssetName)
    const baselineNode = this.findAssetNode(baselineContent, baselineAssetName)

    if (!currentNode || !baselineNode) {
      return 0
    }

    const similarity = this.calculateTreeSimilarity(currentNode, baselineNode)
    this.contentSimilarityCache.set(cacheKey, similarity)
    return similarity
  }

  private findAssetNode(content: ModuleTreeNode[], assetName: string): ModuleTreeNode | undefined {
    const search = (nodes: ModuleTreeNode[]): ModuleTreeNode | undefined => {
      for (const node of nodes) {
        if (node.name === assetName) {
          return node
        }

        if (node.children?.length) {
          const found = search(node.children)
          if (found) {
            return found
          }
        }
      }
      return undefined
    }

    const found = search(content)
    if (found) return found

    const { path, nameWithoutHash } = this.parseFileName(assetName)

    return content.find((node) => {
      const nodeParts = this.parseFileName(node.name)
      return nodeParts.path === path && nodeParts.nameWithoutHash === nameWithoutHash
    })
  }

  private calculateBasicSimilarity(current: ModuleTreeNode, baseline: ModuleTreeNode): number {
    const nameMatch = getBaseModuleName(current.name) === getBaseModuleName(baseline.name)
    const sizeSimilarity = this.calculateSizeSimilarity(current, baseline)
    return (nameMatch ? 0.7 : 0) + sizeSimilarity * 0.3
  }

  private getTreeSimilarityCacheKey(current: ModuleTreeNode, baseline: ModuleTreeNode): string {
    return `${current.name}::${baseline.name}`
  }

  private calculateTreeSimilarity(current: ModuleTreeNode, baseline: ModuleTreeNode, depth = 0, maxDepth = 4): number {
    const cacheKey = this.getTreeSimilarityCacheKey(current, baseline)
    const cached = this.treeSimilarityCache.get(cacheKey)
    if (cached !== undefined) return cached

    if (depth >= maxDepth) {
      return this.calculateBasicSimilarity(current, baseline)
    }

    const MIN_SIZE_THRESHOLD = 1024 // 1KB
    if (
      current.value &&
      baseline.value &&
      (current.value < MIN_SIZE_THRESHOLD || baseline.value < MIN_SIZE_THRESHOLD)
    ) {
      return this.calculateBasicSimilarity(current, baseline)
    }

    const weights = {
      moduleStructure: 0.5,
      size: 0.2,
      dependencies: 0.3,
    }

    let score = 0

    const structureScore = this.calculateModuleStructureSimilarity(current, baseline, depth)
    score += structureScore * weights.moduleStructure

    const sizeScore = this.calculateSizeSimilarity(current, baseline)
    score += sizeScore * weights.size

    const dependencyScore = this.calculateDependencySimilarity(current, baseline)
    score += dependencyScore * weights.dependencies

    this.treeSimilarityCache.set(cacheKey, score)
    return score
  }

  private calculateModuleStructureSimilarity(current: ModuleTreeNode, baseline: ModuleTreeNode, depth: number): number {
    if (!current.children || !baseline.children) {
      return getBaseModuleName(current.name) === getBaseModuleName(baseline.name) ? 1 : 0
    }

    const MIN_CHILD_SIZE = 512
    const significantCurrentChildren = current.children
      .filter((child) => !child.value || child.value > MIN_CHILD_SIZE)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 5)

    const significantBaselineChildren = baseline.children
      .filter((child) => !child.value || child.value > MIN_CHILD_SIZE)
      .sort((a, b) => (b.value || 0) - (a.value || 0))
      .slice(0, 5)

    if (!current.children || !baseline.children) {
      return 0.2
    }

    let childrenSimilarity = 0
    const processedBaselineNodes = new Set<string>()

    for (const currentChild of significantCurrentChildren) {
      let bestChildScore = 0
      let bestMatch: ModuleTreeNode | null = null

      for (const baselineChild of significantBaselineChildren) {
        if (processedBaselineNodes.has(baselineChild.name)) {
          continue
        }

        const childScore = this.calculateTreeSimilarity(currentChild, baselineChild, depth + 1)
        if (childScore > bestChildScore) {
          bestChildScore = childScore
          bestMatch = baselineChild
        }
      }

      if (bestMatch) {
        childrenSimilarity += bestChildScore
        processedBaselineNodes.add(bestMatch.name)
      }
    }

    const currentModules = new Set(significantCurrentChildren.map((node) => getBaseModuleName(node.name)))
    const baselineModules = new Set(significantBaselineChildren.map((node) => getBaseModuleName(node.name)))

    const intersection = new Set([...currentModules].filter((x) => baselineModules.has(x)))
    const union = new Set([...currentModules, ...baselineModules])

    const sizeDiffPenalty =
      Math.abs(currentModules.size - baselineModules.size) / Math.max(currentModules.size, baselineModules.size)

    const directScore = intersection.size / union.size
    const normalizedChildrenSimilarity =
      significantCurrentChildren.length > 0 ? childrenSimilarity / significantCurrentChildren.length : 0

    const finalScore = (directScore * 0.4 + normalizedChildrenSimilarity * 0.6) * (1 - sizeDiffPenalty * 0.3)

    return Math.max(0, finalScore)
  }

  private calculateSizeSimilarity(current: ModuleTreeNode, baseline: ModuleTreeNode): number {
    if (!current.value || !baseline.value) {
      return 0
    }

    const sizeDiff = Math.abs(current.value - baseline.value)
    const maxSize = Math.max(current.value, baseline.value)

    const logDiff = Math.log1p(sizeDiff)
    const logMax = Math.log1p(maxSize)

    return maxSize > 0 ? Math.max(0, 1 - logDiff / logMax) : 1
  }

  private calculateDependencySimilarity(current: ModuleTreeNode, baseline: ModuleTreeNode): number {
    if (!current.children || !baseline.children) {
      return 0
    }

    const normalizePath = (path: string) => {
      const parts = path.split('/')
      return parts[0].startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0]
    }

    const currentDeps = new Set(
      current.children.map((node) => normalizePath(getBaseModuleName(node.name))).filter(Boolean),
    )
    const baselineDeps = new Set(
      baseline.children.map((node) => normalizePath(getBaseModuleName(node.name))).filter(Boolean),
    )

    const intersection = new Set([...currentDeps].filter((x) => baselineDeps.has(x)))
    const union = new Set([...currentDeps, ...baselineDeps])

    const sizeDiffPenalty =
      Math.abs(currentDeps.size - baselineDeps.size) / Math.max(currentDeps.size, baselineDeps.size)
    const baseScore = intersection.size / union.size

    return Math.max(0, baseScore * (1 - sizeDiffPenalty * 0.2))
  }

  private getPackageSimilarityCacheKey(current: PackageInfo[], baseline: PackageInfo[]): string {
    const currentKey = current
      .map((p) => `${p.name}@${p.version}:${p.size.raw}`)
      .sort()
      .join('|')
    const baselineKey = baseline
      .map((p) => `${p.name}@${p.version}:${p.size.raw}`)
      .sort()
      .join('|')
    return `${currentKey}::${baselineKey}`
  }

  private parseFileName(fileName: string): {
    path: string
    nameWithoutHash: string
    isHashOnly: boolean
  } {
    const parts = fileName.split('/')
    const fullName = parts.pop() || ''
    const path = parts.join('/')

    const hashRegex = /^(.*?)?([a-f0-9]{8})\.([^.]+)$/i
    const match = fullName.match(hashRegex)

    if (!match) {
      return {
        path,
        nameWithoutHash: fullName,
        isHashOnly: false,
      }
    }

    const [, namePrefix, , ext] = match
    const isHashOnly = !namePrefix || namePrefix === ''

    return {
      path,
      nameWithoutHash: isHashOnly ? `[hash].${ext}` : `${namePrefix}.[hash].${ext}`,
      isHashOnly,
    }
  }

  private calculateMatchScore(current: AssetInfo, baseline: AssetInfo): number {
    let score = 0
    const weights = {
      pathMatch: 45,
      initialFlag: 5,
      packageSimilarity: 60,
      sizeMatch: 10,
    }

    const currentFileParts = this.parseFileName(current.name)
    const baselineFileParts = this.parseFileName(baseline.name)

    if (currentFileParts.isHashOnly && baselineFileParts.isHashOnly) {
      if (currentFileParts.path === baselineFileParts.path) {
        score += weights.pathMatch * 0.2
      }
    } else if (
      currentFileParts.path === baselineFileParts.path &&
      currentFileParts.nameWithoutHash === baselineFileParts.nameWithoutHash
    ) {
      score += weights.pathMatch
    }

    if (current.initial === baseline.initial) {
      score += weights.initialFlag
    }

    const similarity = this.calculatePackageSimilarity(
      current.packages.filter((p) => typeof p === 'object') as PackageInfo[],
      baseline.packages.filter((p) => typeof p === 'object') as PackageInfo[],
    )
    score += similarity * weights.packageSimilarity

    const sizeDiff = Math.abs(current.size.raw - baseline.size.raw) / Math.max(current.size.raw, baseline.size.raw)
    score += weights.sizeMatch * Math.max(0, 1 - sizeDiff * 2)

    return score
  }

  private calculatePackageSimilarity(currentPkgs: PackageInfo[], baselinePkgs: PackageInfo[]): number {
    if (currentPkgs.length === 0 || baselinePkgs.length === 0) {
      return 0
    }

    const cacheKey = this.getPackageSimilarityCacheKey(currentPkgs, baselinePkgs)
    const cached = this.similarityCache.get(cacheKey)
    if (cached !== undefined) return cached

    const currentTotalSize = currentPkgs.reduce((sum, pkg) => sum + pkg.size.raw, 0)
    const baselineTotalSize = baselinePkgs.reduce((sum, pkg) => sum + pkg.size.raw, 0)

    const baselinePkgMap = new Map(baselinePkgs.map((pkg) => [pkg.name, pkg]))

    const sortedCurrentPkgs = [...currentPkgs].sort((a, b) => b.size.raw - a.size.raw)

    let totalScore = 0
    let processedSize = 0

    for (const currentPkg of sortedCurrentPkgs) {
      const baselinePkg = baselinePkgMap.get(currentPkg.name)
      if (!baselinePkg) continue

      let packageScore = 0

      if (getBaseModuleName(currentPkg.path) === getBaseModuleName(baselinePkg.path)) {
        packageScore += 0.5
      }

      if (currentPkg.version === baselinePkg.version) {
        packageScore += 0.3
      } else {
        const [currentMajor, currentMinor] = (currentPkg.version || '').split('.')
        const [baselineMajor, baselineMinor] = (baselinePkg.version || '').split('.')
        if (currentMajor === baselineMajor && currentMinor === baselineMinor) {
          packageScore += 0.25
        } else if (currentMajor === baselineMajor) {
          packageScore += 0.15
        }
      }

      const sizeDiff = Math.abs(currentPkg.size.raw - baselinePkg.size.raw)
      const maxSize = Math.max(currentPkg.size.raw, baselinePkg.size.raw)
      const sizeRatio = maxSize > 0 ? 1 - sizeDiff / maxSize : 1
      packageScore += sizeRatio * 0.8

      const currentWeight = currentPkg.size.raw / currentTotalSize
      const baselineWeight = baselinePkg.size.raw / baselineTotalSize
      const weight = (currentWeight + baselineWeight) / 2

      totalScore += packageScore * weight
      processedSize += currentPkg.size.raw

      if (processedSize / currentTotalSize > 0.8) {
        break
      }
    }

    this.similarityCache.set(cacheKey, totalScore)

    return totalScore
  }
}

export const assetsMatcher = new AssetsMatcher()
