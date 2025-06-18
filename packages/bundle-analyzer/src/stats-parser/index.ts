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

import { existsSync, readFileSync, readdirSync } from 'fs'
import { basename, join, parse, relative } from 'path'

import { uniqBy, chain, uniq, omit } from 'lodash'

import { readStatsFile } from '../bundle-extractor'
import { installActivatedRunnerScript } from '../install-scripts'
import { getPackageMeta, trimModuleName } from '../module'
import { BundleToolkit, PerfseeReportStats, BundleModule, ID, ModuleReasonTypes } from '../stats'
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
  hashCode,
  parseTreeshaking,
  isDynamicModule,
  isEsmModule,
} from '../utils'

import { assetModulesParser, parseModuleRequiredChunks } from './asset-parser'
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
  ModuleMap,
  Audit,
  Reason,
} from './types'

const defaultLogger = getConsoleLogger()

export class StatsParser {
  static async FromStatsFile(statsFilePath: string, logger: Logger = defaultLogger): Promise<StatsParser> {
    let stats: PerfseeReportStats
    try {
      stats = await readStatsFile(statsFilePath)
    } catch (e) {
      throw new Error(`Failed to read and parse webpack stats.\nInternal Error: ${(e as Error).stack}`)
    }
    return new StatsParser(stats, parse(statsFilePath).dir, logger)
  }

  static FromStats(stats: PerfseeReportStats, assetsPath: string, logger: Logger = defaultLogger): StatsParser {
    return new StatsParser(stats, assetsPath, logger)
  }

  private assetsMap: Map<string, Asset> = new Map()
  private packageVersionMap: Map<string, [version: string, sideEffects?: boolean | string[] | 'implicitly']> = new Map()
  private chunksMap: Map<ID, Chunk> = new Map()
  private auditFetcher?: (rule: string) => Promise<string | Audit | undefined>
  private readonly auditsForLocal: Audit[] = []
  private readonly modulesMap: Map<string, Module> = new Map()
  private readonly entryPointsMap: Map<string, EntryPoint> = new Map()
  private readonly packagePathRefMap: Map<string, BasePackage> = new Map()

  // Used to collect module sources before upload.
  private readonly reasonsMap: Map<
    /* moduleId */ ID,
    /* contains source code loations that should be uploaded */ Reason[]
  > = new Map()
  // Used to find reasons of a module
  private readonly moduleReasonsMap: Map<ID, Reason[]> = new Map()
  // side effects of a module
  private readonly sideEffectsMap: Map<ID, Reason[]> = new Map()
  // Used to find reasons of a package. The two dimension array is used to record reasons from different pacakages.
  private readonly packageReasonsMap: Map<number, Reason[][]> = new Map()
  private readonly strictChunkRelationsMap: Map<ID, ID[]> = new Map()

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

    this.packageVersionMap = new Map(
      this.stats.packageVersions?.map(({ name, version, sideEffects }) => [name, [version, sideEffects]]),
    )
    await this.parseAssets()
    this.parseChunks()
    await this.parseEntryPoints()

    const bundleContent = this.parseBundleContent()

    this.logger.info('Finish parsing stats file.')
    return {
      report: this.serializeResult(),
      moduleTree: bundleContent,
      assets: Array.from(this.assetsMap.values()),
      moduleMap: this.serializeModuleMap(),
      moduleReasons: this.stats.moduleReasons?.moduleSource
        ? {
            ...this.stats.moduleReasons,
            packageReasons: Object.fromEntries(this.packageReasonsMap.entries()),
            moduleReasons: Object.fromEntries(this.moduleReasonsMap.entries()),
            sideEffects: Object.fromEntries(this.sideEffectsMap.entries()),
          }
        : undefined,
      sourceContext: this.stats.buildOptions ? { buildOptions: this.stats.buildOptions } : undefined,
    }
  }

  initAuditFetcher(fetch: (path: string, init?: any) => Promise<any>, cacheDir?: string): this {
    this.auditFetcher = async (rule: string) => {
      const jobType = `extension.bundleAudit.${rule}`
      let runnerScriptEntry = await installActivatedRunnerScript(this.logger, fetch, cacheDir)(jobType)
      this.logger.info(`runner script entry ${runnerScriptEntry}`, runnerScriptEntry)
      if (runnerScriptEntry) {
        runnerScriptEntry = require.resolve(runnerScriptEntry)
        return readFileSync(runnerScriptEntry, 'utf-8')
      }
      return undefined
    }
    return this
  }

  appendAuditsForLocal(audits: Audit[]) {
    this.auditsForLocal.push(...audits)
    return this
  }

  parseReasons() {
    this.parseChunks()
    return this.reasonsMap
  }

  private serializeModuleMap(): ModuleMap {
    const moduleMap: ModuleMap = {}

    for (const module of this.modulesMap.values()) {
      moduleMap[String(module.id)] = {
        path: module.realPath,
        packageRef: module.ref,
        concatenatingLength: module.concatenating.length,
      }
    }

    return moduleMap
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
          moduleRefs: modules.map((m) => m.id),
        }
      }),
      chunks: Array.from(this.chunksMap.values()).map(({ id, modules, assets, children, names, reason, ...chunk }) => ({
        ...chunk,
        assetRefs: mapRefs(assets),
      })),
      packages: Array.from(this.packagePathRefMap.values()),
      repoPath: this.stats.repoPath,
      buildPath: this.stats.buildPath,
      buildTool: this.stats.buildTool,
    }
  }

  private async parseEntryPoints() {
    this.logger.info('Start parsing entry points')
    const refMappedAssets = new Map(Array.from(this.assetsMap).map(([, asset]) => [asset.ref, asset]))
    const entryChunksMap = new Map<string, Chunk[]>()
    const chunkCountMap = new Map<ID, number>()
    const htmls = Array.from(this.assetsMap.values()).filter((asset) => asset.type === AssetTypeEnum.Html)

    for (const [name, entrypoint] of Object.entries(this.stats.entrypoints!)) {
      const chunks = uniqBy(this.flatChunks(entrypoint.chunks), 'ref')
      chunks.forEach((chunk) => chunkCountMap.set(chunk.id, (chunkCountMap.get(chunk.id) || 0) + 1))
      entryChunksMap.set(name, chunks)
    }

    for (const chunk of this.chunksMap.values()) {
      const exclusive = chunkCountMap.get(chunk.id) === 1
      chunk.exclusive = exclusive && Object.keys(this.stats.entrypoints!).length > 1 ? true : undefined
      const chunkAssetsSet = new Set(chunk.assets.map((a) => a.name))

      // edge case: html webpack plugin's output won't be tracked in chunks reference
      // if initial chunk's assets exists in html's script tags, treat it as entry html.
      if (!chunk.async) {
        htmls.forEach((html) => {
          if (html.content) {
            const scripts = getHtmlScripts(html.content)
            if (
              !chunkAssetsSet.has(html.name) &&
              scripts.some((script) => chunkAssetsSet.has(script.replace(this.stats.publicPath!, ''))) &&
              (!this.stats.htmlExclusive || exclusive) // only treat it as entry html when chunk is exclusive in `htmlExclusive` mode
            ) {
              chunk.assets.push(html)
            }
          }
        })
      }
    }

    for (const [name, entrypoint] of Object.entries(this.stats.entrypoints!)) {
      this.logger.verbose(`entry: '${name}'`)
      const chunks = entryChunksMap.get(name)!
      const assets = uniq(chunks.map((chunk) => mapRefs(chunk.assets)).flat()).map((ref) => refMappedAssets.get(ref)!)
      const packages = this.reduceModules(chunks)
      const initialChunks = uniqBy(this.flatChunks(entrypoint.chunks, new Set(), true), 'ref')

      const assetSizeReducer = (acc: Size, asset: Asset) => (asset.intermediate ? acc : addSize(acc, asset.size))

      const size = assets.reduce(assetSizeReducer, getDefaultSize())
      const initialSize = uniq(
        initialChunks.flatMap((chunk) => chunk.assets).filter((asset) => isInitialFileType(asset.type)),
      ).reduce(assetSizeReducer, getDefaultSize())
      const audits = await audit(
        {
          chunks: chunks.map((chunk) => ({
            ...chunk,
            assets: chunk.assets.filter((asset) => !asset.intermediate),
          })),
          assets: assets.filter((asset) => !asset.intermediate),
          packages,
          size,
          stats: this.stats,
          assetsPath: this.assetsPath,
          entryName: name,
        },
        this.logger,
        this.stats.rules,
        this.auditsForLocal,
        this.auditFetcher,
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
        packageAppendixes: packages.map(({ ref, issuers, assets, size, notes }) => {
          const reasons = issuers
            .filter((issuer) => isNotNil(this.packagePathRefMap.get(issuer.path)?.ref))
            .map((issuer) => issuer.reasons)

          this.packageReasonsMap.set(ref, reasons)
          return {
            ref,
            size,
            issuerRefs: issuers
              .map((issuer) => this.packagePathRefMap.get(issuer.path)?.ref)
              .filter(isNotNil) as number[],
            assetRefs: mapRefs(assets),
            notes,
          }
        }),
        audits,
        score: calcEntryPointScore(audits),
      })
    }
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

      const sourcemapFiles = new Set<string>()
      const listAllMapFiles = (dir: string) => {
        try {
          const entries = readdirSync(dir, { withFileTypes: true })
          for (const entry of entries) {
            const fullPath = join(dir, entry.name)
            if (entry.isDirectory()) {
              listAllMapFiles(fullPath)
            } else if (entry.name.endsWith('.map')) {
              sourcemapFiles.add(entry.name)
            }
          }
        } catch (e) {
          // ignore error
          this.logger.warn(`Failed to read directory ${dir}: ${(e as Error).message}`)
        }
      }
      listAllMapFiles(this.assetsPath)

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
          path: realName,
          type,
          modules,
          intermediate,
          sourcemap: sourcemapFiles.has(basename(realName) + '.map'),
          packageRefs: [],
          moduleRefs: [],
        }

        if (existsSync(filepath) && isStringContentType(type)) {
          const content = readFileSync(filepath, 'utf-8')
          asset.content = content
          asset.size = await calcStringCompressedSize(content)
          if (type === AssetTypeEnum.Js) {
            try {
              const parser =
                assetModulesParser[buildTool || BundleToolkit.Webpack] || assetModulesParser[BundleToolkit.Webpack]
              const assetModules = parser(content, path || name, this.stats)

              if (this.stats.strictChunkRelations) {
                const requiredChunkIds = new Set<ID>()
                for (const [_id, moduleContentOrLength] of assetModules) {
                  if (typeof moduleContentOrLength === 'string') {
                    parseModuleRequiredChunks(moduleContentOrLength).forEach((chunkId) => {
                      requiredChunkIds.add(chunkId)
                    })
                  }
                }
                chunks.forEach((chunkId) => {
                  if (!this.strictChunkRelationsMap.get(chunkId)) {
                    this.strictChunkRelationsMap.set(chunkId, [])
                  }

                  this.strictChunkRelationsMap.get(chunkId)!.push(...requiredChunkIds.values())
                })
              }

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
    return chain(m.reasons)
      .filter((reason) => !!reason.moduleName)
      .map((reason) => {
        const meta = this.getPackageMeta(reason.moduleName!)
        if (!meta) {
          return
        }

        const moduleId = hashCode(reason.resolvedModule || '')

        return {
          name: meta.name,
          path: meta.path,
          type: reason.type,
          loc: reason.loc,
          moduleId,
        }
      })
      .filter((value) => !!value)
      .groupBy('path')
      .mapValues((issuers, path) => {
        const reasons: Reason[] = chain(issuers)
          .map((issuer) => ({
            type: issuer!.type,
            loc: issuer!.loc,
            moduleId: issuer!.moduleId,
          }))
          .uniqWith((a, b) => a.loc === b.loc && a.moduleId === b.moduleId && a.type === b.type)
          .slice(0, 10000)
          .groupBy('moduleId')
          .mapValues((issuers) => {
            issuers = issuers.filter((i) => i.type !== 'cjs self exports reference')
            if (issuers.some((i) => i.type !== 'harmony import specifier')) {
              return issuers.filter((i) => i.type !== 'harmony import specifier')
            }
            return issuers.slice(0, 1)
          })
          .values()
          .flatten()
          .map((r) => [ModuleReasonTypes.indexOf(r.type), r.loc, r.moduleId] as Reason)
          .value()

        // Record reasons that module's source need to be collected
        reasons.forEach((reason) => {
          let reasons = this.reasonsMap.get(reason[2])
          if (!reasons) {
            reasons = []
            this.reasonsMap.set(reason[2], reasons)
          }

          reasons.push(reason)
        })

        // Record reasons of all modules
        const id = this.getModuleId(m)
        if (id) {
          let reasonsToSet = this.moduleReasonsMap.get(id)
          if (!reasonsToSet) {
            reasonsToSet = []
            this.moduleReasonsMap.set(id, reasonsToSet)
          }

          reasonsToSet.push(...reasons)
        }

        // Important. Only count modules from different packages as issuers.
        // Avoid package import trace chart to draw infinite loop.
        if (path === meta.path) {
          return null
        }

        return {
          name: issuers[0]!.name,
          path: issuers[0]!.path,
          reasons,
        }
      })
      .reduce((issuers, issuer) => issuers.concat(issuer || []), [] as Issuer[])
      .value()
  }

  private parseChunks() {
    this.logger.info('Start parsing chunks')

    let moduleRef = 1
    const chunks = this.stats.chunks!.map(
      ({ id, initial, names, entry, reason, files, children, modules: chunkModules, auxiliaryFiles }, i) => {
        const chunkAssetsMap = new Map<string, Asset>()
        files.concat((this.stats.includeAuxiliary && auxiliaryFiles) || []).forEach((file) => {
          const asset = this.assetsMap.get(file)
          if (asset) {
            chunkAssetsMap.set(file, asset)
          }
        })

        const parseModules = (rawModules: BundleModule[] = [], concatenatedWith = '') => {
          return rawModules
            .map((fnModule) => {
              let m: Module | undefined
              if (isNotNil(fnModule.id)) {
                m = this.modulesMap.get(String(fnModule.id))
              } else {
                // concatenated module
                m = {
                  id: fnModule.identifier,
                  size: getDefaultSize(),
                  assets: [],
                  concatenating: [],
                } as unknown as Module
                this.modulesMap.set(fnModule.identifier, m)
              }

              if (!m) {
                m = {
                  id: fnModule.identifier,
                  size: getDefaultSize(),
                  assets: [],
                  concatenating: [],
                } as unknown as Module
                this.modulesMap.set(fnModule.identifier, m)
              }

              const meta = this.getPackageMeta(fnModule.name)

              if (!meta) {
                m.name = fnModule.name
                m.path = fnModule.name
                m.ignored = true
                return
              }

              m.name = meta.name
              m.path = meta.path
              m.issuers = this.getIssuers(fnModule, meta)
              m.ignored = false
              m.version = this.packageVersionMap.get(m.path)?.[0]
              m.realPath = fnModule.name
              m.dynamic = isDynamicModule(fnModule)
              m.treeShaking = parseTreeshaking(fnModule, meta, this.packageVersionMap.get(m.path)?.[1])
              m.esm = isEsmModule(fnModule)
              this.parseModuleSideEffects(fnModule)

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

    const ids = chunks.flatMap(({ modules }) => modules?.map((m) => m.id) || [])

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

  private flatChunks(chunks: ID[], existed: Set<ID> = new Set(), onlyInitial?: boolean): Chunk[] {
    return chunks
      .filter((id) => !existed.has(id))
      .map((id) => {
        existed.add(id)
        const chunk = this.chunksMap.get(id)!
        if (chunk) {
          if (onlyInitial && chunk.async) {
            return []
          }
          const children =
            (this.stats.strictChunkRelations
              ? chunk.children?.filter((chunkId) => this.strictChunkRelationsMap.get(id)?.includes(chunkId))
              : chunk.children) || []

          return [chunk, ...this.flatChunks(children, existed, onlyInitial)].filter(isNotNil)
        }
        return []
      })
      .flat()
  }

  private getPackageMeta(name: string): PackageMeta | null {
    return getPackageMeta(name, this.stats.repoPath ?? '/', this.stats.buildPath ?? '/')
  }

  private getModuleId(module: BundleModule): number {
    if (this.stats.buildPath) {
      let relativePath = relative(this.stats.buildPath, module.nameForCondition || trimModuleName(module.name))
      if (!relativePath.startsWith('.')) {
        relativePath = `./${relativePath}`
      }
      return hashCode(relativePath)
    }

    return 0
  }

  private parseModuleSideEffects(module: BundleModule) {
    const moduleId = this.getModuleId(module)
    const sideEffects = module.optimizationBailout
      ?.filter((o) => o.includes('with side effects in source code at'))
      .map((o) => [-1, o.split('with side effects in source code at')[1], moduleId] as Reason)

    if (!sideEffects) {
      return
    }

    this.sideEffectsMap.set(moduleId, [...sideEffects])
    if (this.reasonsMap.has(moduleId)) {
      this.reasonsMap.get(moduleId)!.push(...sideEffects)
    } else {
      this.reasonsMap.set(moduleId, [...sideEffects])
    }
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
