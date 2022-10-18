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

import { existsSync, readFileSync } from 'fs'
import { join, parse } from 'path'

import { uniqBy, chain, uniq, omit } from 'lodash'

import { readStatsFile } from '../bundle-extractor'
import { getPackageMeta } from '../module'
import { BundleToolkit, PerfseeReportStats, BundleModule, ID } from '../stats'
import {
  calcStringCompressedSize,
  addSize,
  getDefaultSize,
  isNotNil,
  isStringContentType,
  mapRefs,
  getHtmlScripts,
  isInitialFileType,
  detectFileType,
  getConsoleLogger,
} from '../utils'

import { assetModulesParser } from './asset-parser'
import { audit, calcBundleScore, calcEntryPointScore } from './audit'
import { Folder } from './tree'
import {
  Asset,
  Chunk,
  Module,
  PackageMeta,
  Package,
  Issuer,
  Logger,
  AssetTypeEnum,
  BasePackage,
  BundleResult,
  EntryPoint,
  Size,
} from './types'

const defaultLogger = getConsoleLogger()

export class StatsParser {
  static FromStatsFile(statsFilePath: string, logger: Logger = defaultLogger): StatsParser {
    let stats: PerfseeReportStats
    try {
      stats = readStatsFile(statsFilePath)
    } catch (e) {
      throw new Error(`Failed to read and parse webpack stats.\nInternal Error: ${(e as Error).message}`)
    }
    return new StatsParser(stats, parse(statsFilePath).dir, logger)
  }

  static FromStats(stats: PerfseeReportStats, assetsPath: string, logger: Logger = defaultLogger): StatsParser {
    return new StatsParser(stats, assetsPath, logger)
  }

  private assetsMap: Map<string, Asset> = new Map()
  private packageVersionMap: Map<string, string> = new Map()
  private chunksMap: Map<ID, Chunk> = new Map()
  private readonly modulesMap: Map<string, Module> = new Map()
  private readonly entryPointsMap: Map<string, EntryPoint> = new Map()
  private readonly packagePathRefMap: Map<string, BasePackage> = new Map()

  private constructor(
    private readonly stats: PerfseeReportStats,
    private readonly assetsPath: string,
    private readonly logger: Logger,
  ) {}

  async parse() {
    this.logger.info('Start parsing stats file.')

    if (!this.stats.entrypoints || !this.stats.assets || typeof this.stats.publicPath === 'undefined') {
      throw new Error('No entrypoints or built assets found in webpack stats.')
    }

    this.packageVersionMap = new Map<string, string>(
      this.stats.packageVersions?.map(({ name, version }) => [name, version]),
    )
    await this.parseAssets()
    this.parseChunks()
    this.parseEntryPoints()

    const bundleContent = this.parseBundleContent()

    this.logger.info('Finish parsing stats file.')
    return {
      report: this.serializeResult(),
      moduleTree: bundleContent,
      assets: Array.from(this.assetsMap.values()),
    }
  }

  private serializeResult(): BundleResult {
    const entryPoints = Array.from(this.entryPointsMap.values())
    return {
      score: calcBundleScore(entryPoints),
      entryPoints,
      assets: Array.from(this.assetsMap.values()).map(({ modules, content, sourcemap, ...properties }) => {
        const packages = new Map<number, Size>()
        modules.forEach(({ ref, size, path, concatenating }) => {
          if (!ref) {
            return
          }
          packages.set(ref, addSize(size, packages.get(ref) ?? getDefaultSize()))

          if (concatenating.length) {
            concatenating.forEach((child) => {
              if (child.path !== path) {
                packages.set(child.ref, addSize(child.size, packages.get(child.ref) ?? getDefaultSize()))
              }
            })
          }
        })

        return {
          ...properties,
          packageRefs: Array.from(packages)
            .map(([ref, size]) => ({
              ref,
              size,
            }))
            .sort((a, b) => b.size.raw - a.size.raw),
        }
      }),
      chunks: Array.from(this.chunksMap.values()).map(({ id, modules, assets, children, names, reason, ...chunk }) => ({
        ...chunk,
        assetRefs: mapRefs(assets),
      })),
      packages: Array.from(this.packagePathRefMap.values()),
    }
  }

  private parseEntryPoints() {
    this.logger.info('Start parsing entry points')
    const refMappedAssets = new Map(Array.from(this.assetsMap).map(([, asset]) => [asset.ref, asset]))

    Object.entries(this.stats.entrypoints!).forEach(([name, entrypoint]) => {
      this.logger.verbose(`entry: '${name}'`)
      const chunks = uniqBy(this.flatChunks(entrypoint.chunks), 'ref')
      const assets = uniq(chunks.map((chunk) => mapRefs(chunk.assets)).flat()).map((ref) => refMappedAssets.get(ref)!)
      const packages = this.reduceModules(chunks)
      const initialChunks = chunks.filter((chunk) => !chunk.async)

      const assetSizeReducer = (acc: Size, asset: Asset) => (asset.intermediate ? acc : addSize(acc, asset.size))

      const size = assets.reduce(assetSizeReducer, getDefaultSize())
      const initialSize = uniq(
        initialChunks.flatMap((chunk) => chunk.assets).filter((asset) => isInitialFileType(asset.type)),
      ).reduce(assetSizeReducer, getDefaultSize())
      const audits = audit(
        {
          chunks: chunks.map((chunk) => ({
            ...chunk,
            assets: chunk.assets.filter((asset) => !asset.intermediate),
          })),
          assets: assets.filter((asset) => !asset.intermediate),
          packages,
          size,
          stats: this.stats,
        },
        this.logger,
      )

      this.entryPointsMap.set(name, {
        // get nextjs entry name
        // https://github.com/vercel/next.js/blob/3dec50001e/packages/next/build/entries.ts#L107
        name: name.replace(/(.*)\/pages\/(.+)$/, '$2'),
        size,
        initialSize,
        assetRefs: mapRefs(assets),
        chunkRefs: mapRefs(chunks),
        initialChunkRefs: mapRefs(initialChunks),
        packageAppendixes: packages.map(({ ref, issuers, assets, size, notes }) => ({
          ref,
          size,
          issuerRefs: issuers
            .map((issuer) => this.packagePathRefMap.get(issuer.path)?.ref)
            .filter(isNotNil) as number[],
          assetRefs: mapRefs(assets),
          notes,
        })),
        audits,
        score: calcEntryPointScore(audits),
      })
    })
  }

  private async parseAssets() {
    if (!this.stats.assets) {
      return
    }

    this.logger.info('Start parsing assets.')
    try {
      let ref = 1
      const assets: Asset[] = []
      const { buildTool } = this.stats
      for (const outputAsset of this.stats.assets) {
        // @ts-expect-error
        const { name, size: parsedSize, intermediate, path, chunks } = outputAsset

        const realName = name.replace(/(\?.*)?(#.*)?$/, '')

        const type = detectFileType(realName)

        if ((type === AssetTypeEnum.Js && !chunks.length) || /\.(map|license\.txt)$/i.test(realName)) {
          continue
        }

        const modules: Module[] = []

        const filepath = join(this.assetsPath, realName)
        const asset: Asset = {
          ref,
          size: { raw: parsedSize, gzip: parsedSize, brotli: parsedSize },
          name,
          type,
          modules,
          intermediate,
          filepath,
          realName,
          sourcemap: existsSync(filepath + '.map') ? filepath + '.map' : undefined,
          packageRefs: [],
        }

        if (existsSync(filepath) && isStringContentType(type)) {
          const content = readFileSync(filepath, 'utf-8')
          asset.content = content
          asset.size = await calcStringCompressedSize(content)
          if (type === AssetTypeEnum.Js) {
            try {
              const assetModules = assetModulesParser[buildTool ?? BundleToolkit.Webpack](content, path, this.stats)

              for (const [id, moduleContentOrLength] of assetModules) {
                const stringifiedId = String(id)
                const moduleSize =
                  typeof moduleContentOrLength === 'number'
                    ? { raw: moduleContentOrLength, gzip: 0, brotli: 0 }
                    : await calcStringCompressedSize(moduleContentOrLength)
                if (!this.modulesMap.has(stringifiedId)) {
                  const m = { id, size: moduleSize, assets: [asset], concatenating: [] as Module[] } as Module
                  this.modulesMap.set(stringifiedId, m)
                } else {
                  // some module maybe duplicated in more then 1 chunks,
                  // controlled by `minChunks`
                  const existedModule = this.modulesMap.get(stringifiedId)!
                  existedModule.assets.push(asset)
                }
                modules.push(this.modulesMap.get(stringifiedId)!)
              }
            } catch (e) {
              this.logger.error(`Failed to parse modules of asset '${name}'`)
              this.logger.error(e as string)
            }
          }
        }

        assets.push(asset)
        ref++
        this.logger.verbose(`Asset parsed '${name}'`)
      }

      this.assetsMap = new Map(assets.map((asset) => [asset.name, asset]))

      this.logger.info('Assets parsing finished')
    } catch (e) {
      throw new Error(`Failed to parse assets.\nInternal Error: ${(e as Error).message}`)
    }
  }

  private readonly getIssuers = (m: BundleModule, meta: PackageMeta): Issuer[] => {
    const { path } = meta
    return chain(m.reasons)
      .filter((reason) => !!reason.moduleName)
      .map((reason) => {
        const meta = this.getPackageMeta(reason.moduleName!)
        if (!meta) {
          return
        }
        return {
          name: meta.name,
          path: meta.path,
          type: reason.type,
        }
      })
      .filter((value): value is Issuer => !!value && value.path !== path)
      .uniqBy('path')
      .value()
  }

  private parseChunks() {
    this.logger.info('Start parsing chunks')
    const htmls = Array.from(this.assetsMap.values()).filter((asset) => asset.type === AssetTypeEnum.Html)

    let moduleRef = 1
    const chunks = this.stats.chunks!.map(
      ({ id, initial, names, entry, reason, files, children, modules: chunkModules }, i) => {
        const chunkAssetsMap = new Map<string, Asset>()
        files.forEach((file) => {
          const asset = this.assetsMap.get(file)
          if (asset) {
            chunkAssetsMap.set(file, asset)
          }
        })

        const parseModules = (rawModules: BundleModule[] = [], concatenatedWith = '') => {
          return rawModules
            .map((fnModule) => {
              const m = isNotNil(fnModule.id)
                ? this.modulesMap.get(String(fnModule.id))
                : // concatenated module
                  ({
                    id: null,
                    size: getDefaultSize(),
                    assets: [],
                    concatenating: [],
                  } as unknown as Module)

              if (!m) {
                return
              }

              const meta = this.getPackageMeta(fnModule.name)

              if (!meta) {
                return
              }

              m.name = meta.name
              m.path = meta.path
              m.issuers = this.getIssuers(fnModule, meta)
              m.ignored = fnModule.name.endsWith('(ignored)')
              m.version = this.packageVersionMap.get(m.path)
              m.realPath = fnModule.name

              if (this.packagePathRefMap.has(m.path)) {
                m.ref = this.packagePathRefMap.get(m.path)!.ref
              } else {
                m.ref = moduleRef
                this.packagePathRefMap.set(m.path, { ...meta, ref: moduleRef, version: m.version })
                moduleRef++
              }

              // has concatenated modules
              if (fnModule.modules?.length) {
                m.concatenating = uniqBy(parseModules(fnModule.modules, meta.path), 'realPath')
              }

              if (concatenatedWith && concatenatedWith !== meta.path && this.packagePathRefMap.has(concatenatedWith)) {
                m.notes = [{ type: 'concat', targetRef: this.packagePathRefMap.get(concatenatedWith)!.ref }]
              }

              if (fnModule.assets?.length) {
                fnModule.assets.forEach((file) => {
                  const asset = this.assetsMap.get(file)
                  if (asset) {
                    chunkAssetsMap.set(file, asset)
                  }
                })
              }

              return m
            })
            .filter(isNotNil) as Module[]
        }

        const modules = parseModules(chunkModules?.filter(isNotNil)).filter(isNotNil)

        // edge case: html webpack plugin's output won't be tracked in chunks reference
        // if initial chunk's assets exists in html's script tags, treat it as entry html.
        if (initial) {
          htmls.forEach((html) => {
            if (html.content) {
              const scripts = getHtmlScripts(html.content)
              if (scripts.some((script) => chunkAssetsMap.has(script.replace(this.stats.publicPath!, '')))) {
                chunkAssetsMap.set(html.name, html)
              }
            }
          })
        }

        this.logger.verbose(`Chunk parsed: '${id}'`)

        return {
          id,
          ref: i + 1,
          entry,
          async: !initial,
          names,
          reason,
          assets: Array.from(chunkAssetsMap.values()),
          children,
          modules,
        } as Chunk
      },
    )
    this.chunksMap = new Map(chunks.map((chunk) => [chunk.id, chunk]))

    this.logger.info(`Chunks parsing finished. Found total ${this.chunksMap.size} chunks`)
  }

  private reduceModules(chunks: Chunk[]): Package[] {
    const packagesMap = new Map<string, Package>()

    const ids = chunks.flatMap(({ modules }) => modules.map((m) => m.id))

    const existingPackages = new Set<string>()
    for (const id of ids) {
      const m = this.modulesMap.get(String(id)) as Module
      if (m?.size.raw) {
        const existedPkg = packagesMap.get(m.path)
        if (existedPkg) {
          existedPkg.size = addSize(existedPkg.size, m.size)
          for (const issuer of m.issuers) {
            existedPkg.issuers.push(issuer)
          }
          for (const asset of m.assets) {
            existedPkg.assets.push(asset)
          }
        } else {
          existingPackages.add(m.path)
          packagesMap.set(m.path, {
            ...omit(m, 'id', 'realPath'),
            // clone issuers and assets for later push
            issuers: m.issuers.concat(),
            assets: m.assets.concat(),
          })
        }

        m.concatenating.forEach((child) => {
          if (child.path === m.path) {
            return
          }
          const existedPkg = packagesMap.get(child.path)
          if (existedPkg) {
            existedPkg.notes = [...(existedPkg.notes ?? []), ...(child.notes ?? [])]
          } else {
            existingPackages.add(child.path)
            packagesMap.set(child.path, {
              ...omit(child, 'id', 'realPath'),
              // clone issuers and assets for later push
              issuers: child.issuers.concat(),
              assets: child.assets.concat(),
            })
          }
        })
      }
    }

    const result: Package[] = []

    for (const pkg of packagesMap.values()) {
      if (!existingPackages.has(pkg.path)) {
        continue
      }

      pkg.assets = uniqBy(pkg.assets, 'ref')
      pkg.issuers = uniqBy(
        pkg.issuers.filter((issuer) => existingPackages.has(issuer.path)),
        'path',
      )
      pkg.notes = uniqBy(pkg.notes, 'targetRef')
      result.push(pkg)
    }

    return result
  }

  private flatChunks(chunks: ID[], existed: Set<ID> = new Set()): Chunk[] {
    return chunks
      .filter((id) => !existed.has(id))
      .map((id) => {
        existed.add(id)
        const chunk = this.chunksMap.get(id)!
        if (chunk) {
          return [chunk, ...this.flatChunks(chunk.children, existed)].filter(isNotNil)
        }
        return []
      })
      .flat()
  }

  private getPackageMeta(name: string): PackageMeta | null {
    return getPackageMeta(name, this.stats.repoPath ?? '/', this.stats.buildPath ?? '/')
  }

  private parseBundleContent() {
    this.logger.info('Start parsing bundle content.')

    try {
      const assetRefEntryPointsMap = new Map<number, string[]>()

      for (const entryPoint of this.entryPointsMap.values()) {
        for (const assetRef of entryPoint.assetRefs) {
          const e = assetRefEntryPointsMap.get(assetRef)
          if (e) {
            e.push(entryPoint.name)
          } else {
            assetRefEntryPointsMap.set(assetRef, [entryPoint.name])
          }
        }
      }

      const res = []
      for (const [key, asset] of this.assetsMap) {
        if (asset.type !== AssetTypeEnum.Js || asset.intermediate) {
          continue
        }

        const root = new Folder('.')
        const { modules } = asset

        modules.forEach((module) => {
          if (!module.realPath) {
            return
          }

          root.addModule(module)
        })
        root.mergeNestedFolders()

        const entryPoints = assetRefEntryPointsMap.get(asset.ref)

        res.push({
          name: key,
          value: asset.size.raw,
          gzip: asset.size.gzip,
          brotli: asset.size.brotli,
          children: Object.values(root.children).map((child) => child.toChartData()),
          entryPoints,
        })
      }

      this.logger.info('Bundle content parsing finished.')
      return res
    } catch (e) {
      this.logger.error('Bundle content parsing failed.', e)
      return []
    }
  }
}
