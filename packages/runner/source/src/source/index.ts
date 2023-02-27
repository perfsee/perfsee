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

import { mkdir, rm, writeFile, readFile } from 'fs/promises'
import { join, parse, relative } from 'path'

import { v4 as uuid } from 'uuid'

import { BundleResult, extractBundleFromStream, ModuleMap, readJSONFile } from '@perfsee/bundle-analyzer'
import { JobWorker } from '@perfsee/job-runner-shared'
import { JobType, SourceAnalyzeJob } from '@perfsee/server-common'
import { FlameChartData, FlameChartDiagnostic } from '@perfsee/shared'
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
  }[]
  bundles: {
    [k: string]: {
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
}

export class SourceJobWorker extends JobWorker<SourceAnalyzeJob> {
  private pwd!: string
  private bundleMetaPath!: string
  private tracePath: string | null = null

  protected async before() {
    if (!analyseProfile) {
      this.fatal(new Error('@perfsee/ori module is not available.'))
    }

    const { payload } = this

    this.pwd = join(process.cwd(), 'tmp', payload.projectId.toString(), uuid())
    await mkdir(this.pwd, { recursive: true })

    await Promise.all([this.prepareArtifacts(), this.prepareTraces()])
  }

  protected async work() {
    const { payload } = this

    const sourceCoverageStorageKey = await this.SourceCoverage()

    const startTime = Date.now()
    this.logger.info(`Start analyze profile of snapshot report.`)
    const analyzeResultStr = await analyseProfile!(this.tracePath!, this.bundleMetaPath, false)
    this.logger.info(`Profile analysis finished, timeSpent=${Date.now() - startTime}ms].`)

    const { diagnostics, profile } = JSON.parse(analyzeResultStr) as ProfileAnalyzeResult
    const flameChartStorageName = `flame-charts/${uuid()}.json`
    this.logger.info(`Uploading analysis flame chart data to artifacts. [name=${flameChartStorageName}]`)
    const flameChartStorageKey = await this.client.uploadArtifact(
      flameChartStorageName,
      Buffer.from(JSON.stringify(profile), 'utf-8'),
    )
    this.logger.info(`Finished uploading. [key=${flameChartStorageKey}]`)

    const result = {
      projectId: payload.projectId,
      reportId: payload.reportId,
      artifactIds: payload.snapshotReport.artifactIds ?? [],
      diagnostics: diagnostics,
      flameChartStorageKey: flameChartStorageKey,
      sourceCoverageStorageKey: sourceCoverageStorageKey,
    }

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

  private async prepareArtifacts() {
    this.logger.info('Downloading bundle artifacts.')
    const pwd = this.pwd

    const bundleList = await Promise.allSettled(
      this.payload.artifacts.map(async ({ id: artifactId, buildKey, reportKey, moduleMapKey, hash }) => {
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

        return { artifactId, hash, bundlePath, bundleReport, moduleMap }
      }),
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

    for (const { artifactId, hash, bundlePath, bundleReport, moduleMap } of bundleList) {
      const baseDir = parse(bundlePath).dir

      bundleReport.assets?.forEach((asset) => {
        if (asset.name.endsWith('.js')) {
          files.push({
            fileName: asset.name,
            bundleId: artifactId.toString(),
            diskPath: join(baseDir, asset.path ?? asset.name),
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

    const bundleMetaPath = join(pwd, 'bundle-meta.json')
    await writeFile(bundleMetaPath, JSON.stringify({ files, bundles } as BundleMeta))
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
}
