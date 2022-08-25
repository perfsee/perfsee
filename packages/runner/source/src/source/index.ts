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

import { extractBundleFromStream, readJSONFile, readStatsFile, trimModuleName } from '@perfsee/bundle-analyzer'
import { JobWorker } from '@perfsee/job-runner-shared'
import { JobType, SourceAnalyzeJob, SourceAnalyzeJobResult } from '@perfsee/server-common'
import { FlameChartData, FlameChartDiagnostic } from '@perfsee/shared'
import { generateSourceCoverageTreemapData, GenerateSourceCoverageTreemapDataOptions } from '@perfsee/source-coverage'

let analyseProfile: typeof import('@perfsee/ori')['analyseProfile'] | null

try {
  const ori = require('@perfsee/ori')
  analyseProfile = ori.analyseProfile
} catch (e) {
  console.warn('@perfsee/ori module is not available')
}

const KEY_EVENT_NAMES = new Set(['Profile', 'thread_name', 'ProfileChunk'])
interface ProfileAnalyzeResult {
  diagnostics: FlameChartDiagnostic[]
  profile: FlameChartData
}

export class SourceJobWorker extends JobWorker<SourceAnalyzeJob> {
  private pwd!: string
  private bundleMetaPath!: string
  private readonly tracePaths: (string | null)[] = []

  protected async before() {
    if (!analyseProfile) {
      this.fatal(new Error('@perfsee/ori module is not available.'))
    }

    const { payload } = this

    this.pwd = join(process.cwd(), 'tmp', payload.projectId.toString(), payload.hash.slice(0, 8))
    await mkdir(this.pwd, { recursive: true })

    await Promise.all([this.prepareArtifacts(), this.prepareTraces()])
  }

  protected async work() {
    const { payload } = this

    const sourceCoverageResult = await this.SourceCoverage()

    const result = await Promise.allSettled(
      this.tracePaths.map(async (tracePath, i) => {
        // nullable for failed downloading
        if (tracePath) {
          const snapshotReport = payload.snapshotReports[i]

          const startTime = Date.now()
          this.logger.info(`Start analyze profile of snapshot report [id=${snapshotReport.id}].`)
          const analyzeResultStr = await analyseProfile!(tracePath, this.bundleMetaPath, false)
          this.logger.info(
            `Profile analysis finished [id=${snapshotReport.id}, timeSpent=${Date.now() - startTime}ms].`,
          )

          const { diagnostics, profile } = JSON.parse(analyzeResultStr) as ProfileAnalyzeResult
          const flameChartStorageKey = `perfsee/flame-charts/${uuid()}.json`
          this.logger.info(`Uploading analysis flame chart data to artifacts. [key=${flameChartStorageKey}]`)
          await this.client.uploadArtifact(flameChartStorageKey, Buffer.from(JSON.stringify(profile), 'utf-8'))
          this.logger.info(`Finished uploading. [key=${flameChartStorageKey}]`)

          const sourceCoverageStorageKey = sourceCoverageResult.find(
            (item) => item.reportId === snapshotReport.id,
          )?.sourceCoverageStorageKey

          return {
            reportId: snapshotReport.id,
            diagnostics,
            flameChartStorageKey,
            sourceCoverageStorageKey,
          }
        }
      }),
    ).then((settledList) => {
      return settledList
        .map((settledResult) => {
          if (settledResult.status === 'fulfilled') {
            return settledResult.value
          } else {
            this.logger.error('Failed to analyze profile', settledResult.reason)
            return undefined
          }
        })
        .filter(Boolean) as SourceAnalyzeJobResult['result']
    })

    this.logger.info('Return source analysis result', { result })

    this.updateJob({
      type: JobType.SourceAnalyze,
      payload: {
        projectId: payload.projectId,
        hash: payload.hash,
        result: result ?? [],
      },
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
    const artifacts = this.payload.artifacts

    const statsPathList = await Promise.allSettled(
      artifacts.map(async (artifact, i) => {
        const readStream = await this.client.getArtifactStream(artifact)
        this.logger.verbose(`Downloading ${artifact} now.`)
        const path = await extractBundleFromStream(readStream, join(pwd, `artifact-${i}`))
        this.logger.verbose(`Downloading ${artifact} finished.`)
        return path
      }),
    ).then((list) => {
      const result: string[] = []
      list.forEach((item, i) => {
        if (item.status === 'fulfilled') {
          result.push(item.value)
        } else {
          this.logger.error(`Failed to download artifact ${artifacts[i]}`, item.reason)
        }
      })
      return result
    })

    const files: Array<{ fileName: string; diskPath: string; statsIndex: number }> = []
    const bundles: Array<{
      moduleMap: Record</* moduleId */ string, /* moduleName */ string>
      repoPath?: string
      buildPath?: string
    }> = []

    statsPathList.forEach((path, i) => {
      const moduleMap: Record<string, string> = {}
      const baseDir = parse(path).dir
      const stats = readStatsFile(path)
      stats.assets?.forEach((asset) => {
        if (asset.name.endsWith('.js')) {
          files.push({
            fileName: asset.name,
            statsIndex: i,
            diskPath: join(baseDir, asset.name),
          })
        }
      })

      stats.chunks?.forEach((chunk) => {
        chunk.modules?.forEach((m) => {
          if (m.id) {
            moduleMap[String(m.id)] = trimModuleName(m.name)
          }
        })
      })

      bundles.push({
        moduleMap,
        repoPath: stats.repoPath,
        buildPath:
          stats.buildPath && stats.repoPath && stats.buildPath !== stats.repoPath
            ? relative(stats.repoPath, stats.buildPath)
            : undefined,
      })
    })

    const bundleMetaPath = join(pwd, 'bundle-meta.json')
    await writeFile(bundleMetaPath, JSON.stringify({ files, bundles }))
    this.bundleMetaPath = bundleMetaPath
    this.logger.info('Finished downloading artifacts.')
  }

  private async prepareTraces() {
    this.logger.info('Downloading runtime trace profiles.')
    const pwd = this.pwd
    const reports = this.payload.snapshotReports

    for (const { id, traceEventsStorageKey } of reports) {
      this.logger.verbose(`Downloading profile ${traceEventsStorageKey}`)
      try {
        const buf = await this.client.getArtifact(traceEventsStorageKey)
        this.logger.verbose(`Downloading profile ${traceEventsStorageKey} finished`)
        const events = JSON.parse(buf.toString('utf8')) as LH.TraceEvent[]

        const profileFile = join(pwd, `profile-${id}.json`)
        await writeFile(profileFile, JSON.stringify(events.filter((event) => KEY_EVENT_NAMES.has(event.name))))
        this.tracePaths.push(profileFile)
      } catch (e) {
        this.tracePaths.push(null)
        this.logger.error(`Failed to download profile ${traceEventsStorageKey}`, { error: e })
      }
    }

    this.logger.info('Finished downloading runtime trace profiles.')
  }

  private async SourceCoverage() {
    if (!this.bundleMetaPath) {
      this.logger.error('Prepare artifacts first.')
    }

    const reports = this.payload.snapshotReports

    const result: { reportId: number; sourceCoverageStorageKey: string }[] = []

    const files = readJSONFile<{ files: Array<{ fileName: string; diskPath: string; statsIndex: number }> }>(
      this.bundleMetaPath,
    ).files
    for (const { id: reportId, pageUrl, jsCoverageStorageKey } of reports) {
      if (!jsCoverageStorageKey) {
        continue
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
      const StorageKey = `perfsee/source-coverage/${uuid()}.json`
      await this.client.uploadArtifact(StorageKey, Buffer.from(JSON.stringify(coverageData), 'utf-8'))
      result.push({ reportId, sourceCoverageStorageKey: StorageKey })
    }

    return result
  }
}
