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

import { existsSync } from 'fs'
import { readFile, rm } from 'fs/promises'
import { join, parse } from 'path'

import { v4 as uuid } from 'uuid'

import { JobWorker } from '@perfsee/job-runner-shared'
import { analyze, extractBundleFromStream, runBrowser, BenchmarkResult, PackageStats } from '@perfsee/package'
import { BundleJobStatus, JobType, PackageJobPayload, PackageJobUpdate } from '@perfsee/server-common'
import { PackOptions } from '@perfsee/shared'

export class PackageWorker extends JobWorker<PackageJobPayload> {
  private pwd!: string
  private packageStatsPath!: string
  private benchmarkFilePath!: string
  private benchmarkResultPath!: string
  private options!: PackOptions

  protected async before() {
    // send job receiving message back
    this.updateJob({
      type: JobType.PackageAnalyze,
      payload: {
        packageBundleId: this.payload.packageBundleId,
        status: BundleJobStatus.Running,
      },
    })

    if (this.payload.buildKey) {
      const { name } = parse(this.payload.buildKey)
      this.pwd = join(process.cwd(), 'tmp', `${name}`)

      // download builds
      this.logger.info(`Start downloading package: ${this.payload.buildKey}.`)
      const { packageStatsPath, benchmarkFilePath, benchmarkResultPath, options } = await extractBundleFromStream(
        await this.client.getArtifactStream(this.payload.buildKey),
        this.pwd,
      )
      this.packageStatsPath = packageStatsPath
      this.benchmarkFilePath = benchmarkFilePath
      this.benchmarkResultPath = benchmarkResultPath
      this.options = options
      this.options.debug = process.env.NODE_ENV === 'development'

      this.logger.info('Downloading finished.')
    } else if (!this.payload.packageString) {
      this.logger.error('Missing package string.')
    }
  }

  protected async work(): Promise<any> {
    this.logger.info('Start package analyzing.')

    let packageStats: PackageStats
    if (this.packageStatsPath) {
      packageStats = JSON.parse(await readFile(this.packageStatsPath, 'utf-8'))
    } else {
      packageStats = await analyze(this.payload.packageString!, this.options, this.logger)
    }
    const packageReportName = `package-stats/${uuid()}.json`
    const packageReportKey = await this.client.uploadArtifact(
      packageReportName,
      Buffer.from(JSON.stringify(packageStats)),
    )
    this.logger.info(`Package analysis result uploaded to artifacts. key is: ${packageReportKey}`)

    let benchmarkResult: BenchmarkResult | undefined
    if (existsSync(this.benchmarkResultPath)) {
      try {
        benchmarkResult = JSON.parse(await readFile(this.benchmarkResultPath, 'utf-8'))
      } catch (e) {
        this.logger.error('Benchmark result parsing failed: ', { error: e })
      }
    } else if (existsSync(this.benchmarkFilePath)) {
      this.logger.info(
        `Becnhmark file found. Start running benchmark. Target: ${
          this.options.target === 'browser' ? 'browser' : 'node'
        }`,
      )

      try {
        benchmarkResult = await runBrowser(
          this.benchmarkFilePath,
          {
            timeout: this.options.benchmarkTimeout ? Number(this.options.benchmarkTimeout) : 30000,
            open: process.env.NODE_ENV === 'development',
            devtools: process.env.NODE_ENV === 'development',
          },
          this.logger,
        )
      } catch (e) {
        this.logger.error('Benchmark running failed: ', { error: e })
      }
    }

    let benchmarkReportKey: string | undefined
    if (benchmarkResult) {
      const benchmarkReportName = `benchmark-results/${uuid()}.json`
      benchmarkReportKey = await this.client.uploadArtifact(
        benchmarkReportName,
        Buffer.from(JSON.stringify(benchmarkResult)),
      )
      this.logger.info(`Benchmark result uploaded to artifacts. key is: ${benchmarkReportKey}`)
    }

    const message: PackageJobUpdate = {
      packageBundleId: this.payload.packageBundleId,
      status: BundleJobStatus.Passed,
      reportKey: packageReportKey,
      benchmarkKey: benchmarkReportKey,
      duration: this.timeSpent,
      size: {
        raw: packageStats.size,
        gzip: packageStats.gzip,
        brotli: 0,
      },
      hasSideEffects: packageStats.hasSideEffects,
      hasJSModule: packageStats.hasJSModule,
      hasJSNext: packageStats.hasJSNext,
      isModuleType: packageStats.isModuleType,
    }
    this.updateJob({
      type: JobType.PackageAnalyze,
      payload: message,
    })
    this.logger.info('Package analysis finished.')

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
      type: JobType.PackageAnalyze,
      payload: {
        packageBundleId: this.payload.packageBundleId,
        failedReason: error.message,
        status: BundleJobStatus.Failed,
        duration: this.timeSpent,
      },
    })
  }
}
