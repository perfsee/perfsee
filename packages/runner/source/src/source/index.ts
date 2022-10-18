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
import { JobType, SourceAnalyzeJob } from '@perfsee/server-common'
import { FlameChartData, FlameChartDiagnostic, LHStoredSchema } from '@perfsee/shared'
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
    src: string
    bundleId: string
    diskPath: string
  }[]
  bundles: {
    [k: string]: {
      moduleMap: Record<string, string>
      dir: string
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
  private lighthouseReport!: LHStoredSchema
  private tracePath: string | null = null

  protected async before() {
    if (!analyseProfile) {
      this.fatal(new Error('@perfsee/ori module is not available.'))
    }

    const { payload } = this

    this.pwd = join(process.cwd(), 'tmp', payload.projectId.toString(), uuid())
    await mkdir(this.pwd, { recursive: true })

    this.lighthouseReport = JSON.parse(
      (await this.client.getArtifact(this.payload.snapshotReport.lighthouseStorageKey)).toString('utf-8'),
    )

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

    this.updateJob({
      type: JobType.SourceAnalyze,
      payload: {
        projectId: payload.projectId,
        reportId: payload.reportId,
        diagnostics: diagnostics,
        flameChartStorageKey: flameChartStorageKey,
        sourceCoverageStorageKey: sourceCoverageStorageKey,
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
    const artifactBuildKeys = Object.entries(this.payload.artifactBuildKeys)

    const bundles: BundleMeta['bundles'] = await Promise.allSettled(
      artifactBuildKeys.map(async ([artifactId, buildKey]) => {
        const readStream = await this.client.getArtifactStream(buildKey)
        this.logger.verbose(`Downloading ${[artifactId, buildKey]} now.`)
        const path = await extractBundleFromStream(readStream, join(pwd, `artifact-${artifactId}`))
        this.logger.verbose(`Downloading ${[artifactId, buildKey]} finished.`)
        return [artifactId, path] as [string, string]
      }),
    ).then((list) => {
      const bundles = []
      for (let i = 0; i < list.length; i++) {
        const item = list[i]

        if (item.status === 'fulfilled') {
          const [id, statsPath] = item.value
          const moduleMap: Record<string, string> = {}
          const stats = readStatsFile(statsPath)

          stats.chunks?.forEach((chunk) => {
            chunk.modules?.forEach((m) => {
              if (m.id) {
                moduleMap[String(m.id)] = trimModuleName(m.name)
              }
            })
          })

          bundles.push([
            id,
            {
              moduleMap,
              dir: parse(statsPath).dir,
              repoPath: stats.repoPath,
              buildPath:
                stats.buildPath && stats.repoPath && stats.buildPath !== stats.repoPath
                  ? relative(stats.repoPath, stats.buildPath)
                  : undefined,
            },
          ] as const)
        } else {
          this.logger.error(`Failed to download artifact ${artifactBuildKeys[i]}`, item.reason)
        }
      }
      return Object.fromEntries(bundles)
    })

    const files: BundleMeta['files'] = (this.lighthouseReport.scripts ?? [])
      .filter((script) => script.artifactId && script.artifactAssetPathName)
      .map((script) => ({
        src: script.src,
        bundleId: script.artifactId!.toString(),
        diskPath: join(bundles[script.artifactId!].dir, script.artifactAssetPathName!),
      }))

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

    const pageUrl = this.lighthouseReport.url

    const files = readJSONFile<BundleMeta>(this.bundleMetaPath).files

    if (!jsCoverageStorageKey) {
      return
    }
    const buf = await this.client.getArtifact(jsCoverageStorageKey)
    const jsCoverageData = JSON.parse(buf.toString('utf8')) as LH.Artifacts['JsUsage']
    const scriptUrls = Object.keys(jsCoverageData)

    const source: GenerateSourceCoverageTreemapDataOptions['source'] = []

    for (const scriptUrl of scriptUrls) {
      const file = files.find((file) => scriptUrl === file.src)

      if (!file) {
        continue
      }

      const content = await readFile(file.diskPath, 'utf-8')

      try {
        const sourcemap = readJSONFile<LH.Artifacts.RawSourceMap>(file.diskPath + '.map')
        source.push({
          url: file.src,
          content,
          map: sourcemap,
        })
      } catch (err) {
        this.logger.error('error load sourcemap: ' + file.diskPath + '.map', { error: err })
        // error load sourcemap
        source.push({
          url: file.src,
          content,
        })
      }
    }

    const coverageData = await generateSourceCoverageTreemapData({ jsCoverageData, source, pageUrl })
    const storageName = `source-coverage/${uuid()}.json`
    return this.client.uploadArtifact(storageName, Buffer.from(JSON.stringify(coverageData), 'utf-8'))
  }
}
