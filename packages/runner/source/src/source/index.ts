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

import { statSync } from 'fs'
import { mkdir, rm, writeFile, readFile } from 'fs/promises'
import { basename, join, parse, relative } from 'path'

import { uniq } from 'lodash'
import { v4 as uuid } from 'uuid'

import {
  addSize,
  getDefaultSize,
  BundleResult,
  extractBundleFromStream,
  ModuleMap,
  readJSONFile,
  Size,
} from '@perfsee/bundle-analyzer'
import { JobWorker } from '@perfsee/job-runner-shared'
import { JobType, SourceAnalyzeJob, SourceAnalyzeJobResult, SourceStatus } from '@perfsee/server-common'
import {
  FlameChartData,
  FlameChartDiagnostic,
  ReactDevtoolProfilingDataExport,
  SourceAnalyzeStatistics,
} from '@perfsee/shared'
import { generateSourceCoverageTreemapData, GenerateSourceCoverageTreemapDataOptions } from '@perfsee/source-coverage'

let analyseProfile: typeof import('@perfsee/ori')['analyseProfile'] | null

try {
  const ori = require('@perfsee/ori')
  analyseProfile = ori.analyseProfile
} catch (e) {
  console.warn('@perfsee/ori module is not available')
}

interface BundleMeta {
  files: {
    fileName: string
    bundleId: string
    diskPath: string
    entryPoints: string[]
    async: boolean
    size: Size
    sourceMap: boolean
  }[]
  bundles: {
    [k: string]: {
      name: string
      moduleMap: Record<string, string>
      dir: string
      hash: string
      repoPath: string | undefined
      buildPath: string | undefined
    }
  }
}

const KEY_EVENT_NAMES = new Set(['Profile', 'thread_name', 'ProfileChunk'])
interface ProfileAnalyzeResult {
  diagnostics: FlameChartDiagnostic[]
  profile: FlameChartData
  artifacts: {
    'time-using-by-script-file'?: Record<string, number>
    'total-execution-time'?: number
  }
  reactLocations?: ReadonlyArray<
    | {
        name: string
        file: string
        line: number
        col: number
      }
    | undefined
  >
}

export class SourceJobWorker extends JobWorker<SourceAnalyzeJob> {
  private pwd!: string
  private bundleMeta!: BundleMeta
  private bundleMetaPath!: string
  private tracePath: string | null = null
  private reactPath: string | null = null
  private reactProfile?: ReactDevtoolProfilingDataExport
  private result!: ProfileAnalyzeResult

  protected async before() {
    this.updateJob({
      type: JobType.SourceAnalyze,
      payload: {
        reportId: this.payload.reportId,
        status: SourceStatus.Running,
      },
    })

    if (!analyseProfile) {
      this.fatal(new Error('@perfsee/ori module is not available.'))
    }

    const { payload } = this

    this.pwd = join(process.cwd(), 'tmp', payload.projectId.toString(), uuid())
    await mkdir(this.pwd, { recursive: true })

    await Promise.all([this.prepareArtifacts(), this.prepareTraces(), this.prepareReactProfile()])
  }

  protected async work() {
    const { payload } = this

    const sourceCoverageStorageKey = await this.SourceCoverage()

    const startTime = Date.now()
    this.logger.info(`Start analyze profile of snapshot report.`)
    const analyzeResultStr = await analyseProfile!(this.tracePath!, this.bundleMetaPath, this.reactPath, false)
    this.logger.info(`Profile analysis finished, timeSpent=${Date.now() - startTime}ms].`)

    this.result = JSON.parse(analyzeResultStr) as ProfileAnalyzeResult
    const { diagnostics, profile, reactLocations } = this.result
    const flameChartStorageName = `flame-charts/${uuid()}.json`
    this.logger.info(`Uploading analysis flame chart data to artifacts. [name=${flameChartStorageName}]`)
    const flameChartStorageKey = await this.client.uploadArtifact(
      flameChartStorageName,
      Buffer.from(JSON.stringify(profile), 'utf-8'),
    )
    this.logger.info(`Finished uploading. [key=${flameChartStorageKey}]`)

    this.logger.info(`Start generate statistics information`)
    let statisticsStorageKey
    try {
      statisticsStorageKey = await this.statisticsInformation()
    } catch (err) {
      this.logger.error(
        'Failed to generate statistics information, ' + (err instanceof Error ? err.stack : String(err)),
      )
    }

    let reactProfileStorageKey = this.payload.snapshotReport.reactProfileStorageKey
    if (this.reactProfile && reactLocations) {
      this.logger.info(`Start uploading parsed react locations`)
      try {
        const reactProfileStorageName = `react-profile/${uuid()}.json`
        reactProfileStorageKey = await this.client.uploadArtifact(
          reactProfileStorageName,
          Buffer.from(
            JSON.stringify({
              ...this.reactProfile!,
              parsedLocations: reactLocations,
            }),
            'utf-8',
          ),
        )
      } catch (e) {
        this.logger.error('Failed to uploading parsed react locations', { error: e })
      }
    }

    const result = {
      status: SourceStatus.Completed as const,
      projectId: payload.projectId,
      reportId: payload.reportId,
      artifactIds: payload.artifacts.map((a) => a.id),
      diagnostics: diagnostics,
      flameChartStorageKey: flameChartStorageKey,
      sourceCoverageStorageKey: sourceCoverageStorageKey,
      statisticsStorageKey: statisticsStorageKey,
      reactProfileStorageKey,
    } as SourceAnalyzeJobResult

    this.logger.info('Return source analysis result', { result })

    this.updateJob({
      type: JobType.SourceAnalyze,
      payload: result,
    })
  }

  protected async after() {
    if (process.env.NODE_ENV !== 'development') {
      await rm(this.pwd, { force: true, recursive: true }).catch((e) => {
        this.logger.warn('Failed to remove working directory', e)
      })
    }
  }

  protected onError(_e: Error) {
    this.updateJob({
      type: JobType.SourceAnalyze,
      payload: {
        reportId: this.payload.reportId,
        status: SourceStatus.Failed,
      },
    })
  }

  private async prepareArtifacts() {
    this.logger.info('Downloading bundle artifacts.')
    const pwd = this.pwd

    const bundleList = await Promise.allSettled(
      this.payload.artifacts.map(
        async ({ id: artifactId, iid: artifactIid, name: artifactName, buildKey, reportKey, moduleMapKey, hash }) => {
          if (!reportKey) {
            throw new Error(`Skip artifact ${artifactId} missing reportKey`)
          }
          const readStream = await this.client.getArtifactStream(buildKey)
          this.logger.verbose(`Downloading ${[artifactId, buildKey]} now.`)
          const bundlePath = await extractBundleFromStream(readStream, join(pwd, `artifact-${artifactId}`))
          this.logger.verbose(`Downloading ${[artifactId, buildKey]} finished.`)

          this.logger.verbose(`Downloading ${[artifactId, reportKey]} now.`)
          const bundleReport = JSON.parse((await this.client.getArtifact(reportKey)).toString('utf-8')) as BundleResult
          this.logger.verbose(`Downloading ${[artifactId, reportKey]} finished.`)

          this.logger.verbose(`Downloading ${[artifactId, moduleMapKey]} now.`)
          const moduleMap =
            moduleMapKey && (JSON.parse((await this.client.getArtifact(moduleMapKey)).toString('utf-8')) as ModuleMap)
          this.logger.verbose(`Downloading ${[artifactId, moduleMapKey]} finished.`)

          return { artifactId, artifactIid, artifactName, hash, bundlePath, bundleReport, moduleMap }
        },
      ),
    ).then((list) => {
      const result = []
      for (let i = 0; i < list.length; i++) {
        const item = list[i]
        if (item.status === 'fulfilled') {
          result.push(item.value)
        } else {
          this.logger.error(`Failed to download artifact ${this.payload.artifacts[i]}`, item.reason)
        }
      }
      return result
    })

    const files: BundleMeta['files'] = []
    const bundles: BundleMeta['bundles'] = {}

    for (const { artifactId, artifactIid, artifactName, hash, bundlePath, bundleReport, moduleMap } of bundleList) {
      const baseDir = parse(bundlePath).dir

      bundleReport.assets.forEach((asset) => {
        if (asset.name.endsWith('.js')) {
          const chunks = bundleReport.chunks.filter((c) => c.assetRefs.includes(asset.ref))
          const entryChunks = chunks.filter((c) => c.entry)
          const async = !(chunks.some((c) => !c.async) /* if all chunk is async */)
          const entryPoints = bundleReport.entryPoints
            .filter((entry) => entryChunks.some((c) => entry.chunkRefs.includes(c.ref)))
            .map((entry) => entry.name)

          const diskPath = join(baseDir, asset.path ?? asset.name)
          let sourceMap = false
          try {
            const stats = statSync(diskPath)
            sourceMap = stats.isFile()
          } catch {
            // ignore error
          }

          files.push({
            fileName: asset.name,
            bundleId: artifactId.toString(),
            diskPath: join(baseDir, asset.path ?? asset.name),
            entryPoints,
            sourceMap,
            async,
            size: asset.size,
          })
        }
      })

      const bundleModuleMap = {}

      if (moduleMap) {
        for (const moduleId in moduleMap) {
          const module = moduleMap[moduleId]
          const moduleName =
            module.concatenatingLength > 0 ? module.path + `+${module.concatenatingLength} modules` : module.path

          bundleModuleMap[moduleId] = moduleName
        }
      }

      bundles[artifactId] = {
        name: `${artifactName} #${artifactIid}`,
        moduleMap: bundleModuleMap,
        dir: baseDir,
        repoPath: bundleReport.repoPath,
        hash,
        buildPath:
          bundleReport.buildPath && bundleReport.repoPath && bundleReport.buildPath !== bundleReport.repoPath
            ? relative(bundleReport.repoPath, bundleReport.buildPath)
            : undefined,
      }
    }

    this.bundleMeta = { files, bundles }
    const bundleMetaPath = join(pwd, 'bundle-meta.json')
    await writeFile(bundleMetaPath, JSON.stringify(this.bundleMeta))
    this.bundleMetaPath = bundleMetaPath
    this.logger.info('Finished downloading artifacts.')
  }

  private async prepareTraces() {
    this.logger.info('Downloading runtime trace profiles.')
    const pwd = this.pwd
    const { traceEventsStorageKey } = this.payload.snapshotReport

    this.logger.verbose(`Downloading profile ${traceEventsStorageKey}`)
    try {
      const buf = await this.client.getArtifact(traceEventsStorageKey)
      this.logger.verbose(`Downloading profile ${traceEventsStorageKey} finished`)
      const events = JSON.parse(buf.toString('utf8')) as LH.TraceEvent[]

      const profileFile = join(pwd, `profile.json`)
      await writeFile(profileFile, JSON.stringify(events.filter((event) => KEY_EVENT_NAMES.has(event.name))))
      this.tracePath = profileFile
    } catch (e) {
      this.tracePath = null
      this.logger.error(`Failed to download profile ${traceEventsStorageKey}`, { error: e })
      throw e
    }

    this.logger.info('Finished downloading runtime trace profiles.')
  }

  private async prepareReactProfile() {
    const { reactProfileStorageKey } = this.payload.snapshotReport

    if (!reactProfileStorageKey) {
      return
    }

    this.logger.info('Downloading react profile.')

    try {
      const buf = await this.client.getArtifact(reactProfileStorageKey)
      const reactProfile = JSON.parse(buf.toString('utf-8')) as ReactDevtoolProfilingDataExport
      this.reactProfile = reactProfile
      this.logger.verbose(`Downloading react profile ${reactProfileStorageKey} finished`)
      if (!reactProfile.fiberLocations) {
        this.reactPath = null
        this.logger.info(`No locations found. Skip analyzing react profile source.`)
        return
      }
      const reactPath = join(this.pwd, `react-locations.json`)
      await writeFile(reactPath, JSON.stringify(reactProfile.fiberLocations))
      this.reactPath = reactPath
    } catch (e) {
      this.reactPath = null
      this.logger.error(`Failed to download react profile ${reactProfileStorageKey}`, { error: e })
      throw e
    }

    this.logger.info('Finished downloading react profile.')
  }

  private async SourceCoverage() {
    if (!this.bundleMetaPath) {
      this.logger.error('Prepare artifacts first.')
    }

    const { jsCoverageStorageKey } = this.payload.snapshotReport

    const pageUrl = this.payload.snapshotReport.pageUrl

    const files = readJSONFile<BundleMeta>(this.bundleMetaPath).files

    if (!jsCoverageStorageKey) {
      return
    }
    const buf = await this.client.getArtifact(jsCoverageStorageKey)
    const jsCoverageData = JSON.parse(buf.toString('utf8')) as LH.Artifacts['JsUsage']
    const scriptUrls = Object.keys(jsCoverageData)

    const source: GenerateSourceCoverageTreemapDataOptions['source'] = []

    for (const scriptUrl of scriptUrls) {
      const file = files.find((file) => scriptUrl.endsWith(file.fileName))

      if (!file) {
        continue
      }

      const content = await readFile(file.diskPath, 'utf-8')

      try {
        const sourcemap = readJSONFile<LH.Artifacts.RawSourceMap>(file.diskPath + '.map')
        source.push({
          filename: file.fileName,
          content,
          map: sourcemap,
        })
      } catch (err) {
        this.logger.error('error load sourcemap: ' + file.diskPath + '.map', { error: err })
        // error load sourcemap
        source.push({
          filename: file.fileName,
          content,
        })
      }
    }

    const coverageData = await generateSourceCoverageTreemapData({ jsCoverageData, source, pageUrl })
    const storageName = `source-coverage/${uuid()}.json`
    return this.client.uploadArtifact(storageName, Buffer.from(JSON.stringify(coverageData), 'utf-8'))
  }

  private async statisticsInformation() {
    const result: SourceAnalyzeStatistics = {}

    // scriptCount
    {
      result.scriptCount = this.payload.snapshotReport.scripts?.length
    }

    // sourceMapCount
    {
      result.sourceMapCount = this.payload.snapshotReport.scripts?.filter((s) => {
        return this.bundleMeta.files.find((f) => f.fileName.endsWith(s.fileName))?.sourceMap
      }).length
    }

    // totalExecutionTimeMs
    {
      if (typeof this.result.artifacts['total-execution-time'] === 'number') {
        result.totalExecutionTimeMs = this.result.artifacts['total-execution-time'] /* microseconds */ / 1000
      }
    }

    // artifacts
    {
      const artifacts = this.payload.artifacts.map((a) => ({
        id: a.iid,
        rawId: a.id,
        hash: a.hash,
        branch: a.branch,
        createdAt: a.createdAt,
        entryPoints: [] as string[],
        size: getDefaultSize(),
        initialSize: getDefaultSize(),
      }))

      for (const script of this.payload.snapshotReport.scripts ?? []) {
        const file = this.bundleMeta.files.find((f) => f.fileName.endsWith(script.fileName))
        const artifact = file && artifacts.find((artifact) => String(artifact.rawId) === file.bundleId)
        if (artifact && file) {
          artifact.size = addSize(file.size, artifact.size)
          if (!file.async) {
            artifact.initialSize = addSize(file.size, artifact.initialSize)
          }
          if (file.entryPoints.length > 0) {
            artifact.entryPoints = uniq([...artifact.entryPoints, ...file.entryPoints])
          }
        }
      }

      result.artifacts = artifacts
    }

    // thirdPartyScriptTimeUsingMs
    {
      const timeUsing = this.result.artifacts['time-using-by-script-file']
      let thirdPartyScriptTimeUsingMs = 0

      for (const scriptFile in timeUsing) {
        const isThirdPartyScript = !this.bundleMeta.files.find((file) => scriptFile.endsWith(basename(file.fileName)))
        if (isThirdPartyScript) {
          thirdPartyScriptTimeUsingMs += timeUsing[scriptFile] /* microseconds */ / 1000
        }
      }
      result.thirdPartyScriptTimeUsingMs = thirdPartyScriptTimeUsingMs
    }

    const storageName = `source-statistics/${uuid()}.json`
    return this.client.uploadArtifact(storageName, Buffer.from(JSON.stringify(result), 'utf-8'))
  }
}
