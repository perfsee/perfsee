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

import chalk from 'chalk'
import findCacheDir from 'find-cache-dir'
import { merge } from 'lodash'
import fetch from 'node-fetch'

import { calcBundleScore, StatsParser, PerfseeReportStats, Audit } from '@perfsee/bundle-analyzer'

import { getBuildEnv } from './build-env'
import { formatAuditResult } from './formater'
import { CommonPluginOptions } from './options'
import { saveReport, PACKAGE_NAME } from './viewer'

export async function generateReports(stats: PerfseeReportStats, outputPath: string, options: CommonPluginOptions) {
  const { enableAudit, shouldPassAudit = (score) => score >= 80, failIfNotPass = false, processStats } = options

  if (!enableAudit) {
    return
  }

  if (processStats) {
    const processedStats = processStats(stats)
    if (processedStats) {
      stats = processedStats
    } else {
      return
    }
  }

  stats.rules = options.rules?.filter((rule) => typeof rule === 'string') as string[]
  stats.includeAuxiliary = options.includeAuxiliary

  try {
    console.info('Start bundle analyzing')
    // @ts-expect-error we made it
    // eslint-disable-next-line no-console
    console.verbose = console.info
    const platform = options.platform ?? getBuildEnv().platform
    const { report, moduleTree, moduleReasons } = await StatsParser.FromStats(stats, outputPath, console as any)
      .appendAuditsForLocal((options.rules?.filter((rule) => typeof rule === 'function') as Audit[]) || [])
      .initAuditFetcher((path, init) => {
        return fetch(
          `${platform}${path}`,
          merge(
            {
              headers: {
                Authorization: `Bearer ${options.token!}`,
              },
            },
            init,
          ),
        ) as any
      }, findCacheDir({ name: PACKAGE_NAME }))
      .parse()
    const score = calcBundleScore(report.entryPoints)

    // directly output formatted content in CI
    if (getBuildEnv().isCi) {
      console.info(formatAuditResult(report))

      if (typeof score === 'number') {
        let pass = shouldPassAudit(score, report)
        if (pass instanceof Promise) {
          pass = await pass
        }

        if (!pass && failIfNotPass) {
          console.error(chalk.red('[@perfsee/webpack] Bundle audit not pass.'))
          process.exit(1)
        }
      }

      console.info('Finish bundle audit')
    } else {
      // start local server with report UI served
      await saveReport(
        {
          branch: '',
          hash: '',
          report: report,
          content: moduleTree,
          moduleReasons,
        },
        outputPath,
        options.reportOptions,
      )
    }
  } catch (e) {
    console.error('Bundle audit error: ', e)
  }
}
