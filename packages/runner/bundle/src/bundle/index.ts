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

import { rm } from 'fs/promises'
import { join, parse, basename } from 'path'

import { v4 as uuid } from 'uuid'

import {
  addSize,
  appendCacheInvalidation,
  calcBundleScore,
  getDefaultSize,
  Size,
  EntryPoint,
  StatsParser,
  extractBundleFromStream,
  readStatsFile,
  AssetTypeEnum,
} from '@perfsee/bundle-analyzer'
import { JobWorker } from '@perfsee/job-runner-shared'
import {
  BundleJobPayload,
  BundleJobUpdate,
  BundleJobStatus,
  JobType,
  BundleJobEntryPoint,
} from '@perfsee/server-common'
import { briefEntryDiff, BundleAuditWarning, BundleResult, diffBundleResult } from '@perfsee/shared'

export class BundleWorker extends JobWorker<BundleJobPayload> {
  private pwd!: string
  private statsFilePath!: string

  protected async before() {
    const { name } = parse(this.payload.buildKey)
    this.pwd = join(process.cwd(), 'tmp', `${name}`)

    // send job receiving message back
    this.updateJob({
      type: JobType.BundleAnalyze,
      payload: {
        artifactId: this.payload.artifactId,
        status: BundleJobStatus.Running,
      },
    })
    // download builds
    this.logger.info(`Start downloading build: ${this.payload.buildKey}.`)
    this.statsFilePath = await extractBundleFromStream(
      await this.client.getArtifactStream(this.payload.buildKey),
      this.pwd,
    )
    this.logger.info('Downloading finished.')
  }

  protected async work(): Promise<any> {
    const { payload: job } = this

    // parse bundle
    const stats = await readStatsFile(this.statsFilePath)
    const { report, moduleTree, assets, moduleMap } = await StatsParser.FromStats(
      stats,
      parse(this.statsFilePath).dir,
      this.logger,
    )
      .initAuditFetcher(this.client.fetch.bind(this.client))
      .parse()

    const bundleReportName = `bundle-results/${uuid()}.json`
    const bundleReportKey = await this.client.uploadArtifact(bundleReportName, Buffer.from(JSON.stringify(report)))
    this.logger.info(`Bundle analysis result uploaded to artifacts. key is: ${bundleReportKey}`)

    const bundleContentName = `bundle-content/${uuid()}.json`
    let bundleContentKey
    if (moduleTree.length) {
      bundleContentKey = await this.client.uploadArtifact(bundleContentName, Buffer.from(JSON.stringify(moduleTree)))
      this.logger.info(`Bundle content result uploaded to artifacts. key is: ${bundleContentKey}`)
    }

    const moduleMapName = `modules-map/${uuid()}.json`
    const moduleMapKey = await this.client.uploadArtifact(moduleMapName, Buffer.from(JSON.stringify(moduleMap)))
    this.logger.info(`Module map uploaded to artifacts. key is: ${moduleMapKey}`)

    let baselineResult: BundleResult | null = null
    try {
      if (job.baselineReportKey) {
        this.logger.info(`Baseline provided. Download it now: ${job.baselineReportKey}.`)
        const buffer = await this.client.getArtifact(job.baselineReportKey)
        baselineResult = JSON.parse(buffer.toString('utf-8')) as BundleResult
      }
    } catch (e) {
      this.logger.error('Failed to download baseline result.', { error: e })
    }

    if (baselineResult) {
      this.logger.info('Append cache invalidation audits')
      appendCacheInvalidation(report, baselineResult)
    }

    this.logger.info('Generating bundle audit aggregated result')
    const entryPoints = this.generateEntryPoints(report, baselineResult)

    const scripts = []
    for (const asset of assets) {
      if (asset.type === AssetTypeEnum.Js && asset.sourcemap && asset.content) {
        scripts.push({
          fileName: basename(asset.name),
        })
      }
    }

    const message: BundleJobUpdate = {
      artifactId: this.payload.artifactId,
      status: BundleJobStatus.Passed,
      reportKey: bundleReportKey,
      contentKey: bundleContentKey,
      moduleMapKey: moduleMapKey,
      score: calcBundleScore(report.entryPoints),
      entryPoints,
      duration: this.timeSpent,
      totalSize: this.calculateTotalSize(report),
      scripts,
    }
    this.updateJob({
      type: JobType.BundleAnalyze,
      payload: message,
    })
    this.logger.info('Bundle analysis finished.')

    return message
  }

  protected async after() {
    try {
      await rm(this.pwd, {
        recursive: true,
      })
    } catch (e) {
      this.logger.warn('Unable to clean working directory.')
      this.logger.warn(`${e}`)
    }
  }

  protected onError(error: Error) {
    this.updateJob({
      type: JobType.BundleAnalyze,
      payload: {
        artifactId: this.payload.artifactId,
        failedReason: error.message,
        status: BundleJobStatus.Failed,
        duration: this.timeSpent,
      },
    })
  }

  private generateEntryPoints(
    jobResult: BundleResult,
    baselineResult?: BundleResult | null,
  ): Record<string, BundleJobEntryPoint> {
    const diffResult = diffBundleResult(jobResult, baselineResult)

    const result: Record<string, BundleJobEntryPoint> = {}

    for (const entryPointName in diffResult) {
      const entryPoint = briefEntryDiff(diffResult[entryPointName])
      const warnings = this.generateWarnings(
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

  private generateWarnings(entryPoint: EntryPoint, baseline?: EntryPoint | null): BundleAuditWarning[] {
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

  private calculateTotalSize(jobResult: BundleResult): Size {
    return jobResult.assets.reduce((total, asset) => {
      return addSize(total, asset.size)
    }, getDefaultSize())
  }
}
