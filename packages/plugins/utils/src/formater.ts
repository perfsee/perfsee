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

import Chalk, { Instance } from 'chalk'
import { getBorderCharacters, table } from 'table'

import { BundleAuditScore, BundleResult, calcBundleScore, calcEntryPointScore } from '@perfsee/bundle-analyzer'
import { PrettyBytes } from '@perfsee/utils'

const chalk =
  process.env.NODE_ENV === 'test' && process.env.ENABLE_REPORT_COLOR !== 'true' ? new Instance({ level: 0 }) : Chalk

export function formatAuditResult(bundleResult: BundleResult) {
  const bundleScore = calcBundleScore(bundleResult.entryPoints)

  const tableData: [string][] = []

  const entryPoints = bundleResult.entryPoints
    .map((entryPoint) => ({
      score: calcEntryPointScore(entryPoint.audits),
      entryPoint,
    }))
    .sort((a, b) => (a.score ?? Infinity) - (b.score ?? Infinity))

  // show 2 entry points with the lowest score
  const showLength = 2
  for (const { entryPoint } of entryPoints.slice(0, showLength)) {
    tableData.push([
      `Entry Point: ${entryPoint.name} - ${PrettyBytes.stringify(
        typeof entryPoint.size === 'number' ? entryPoint.size : entryPoint.size.raw,
      )}`,
    ])

    const audits = entryPoint.audits
      ? entryPoint.audits.filter((audit) => audit.score <= BundleAuditScore.Warn).sort((a, b) => a.score - b.score)
      : []

    if (audits.length > 0) {
      for (const audit of audits) {
        const message: string[] = []

        let emoji
        switch (audit.score) {
          case BundleAuditScore.Notice:
            emoji = chalk.gray('i')
            break
          case BundleAuditScore.Warn:
            emoji = chalk.yellow('W')
            break
          case BundleAuditScore.Bad:
            emoji = chalk.red('E')
            break
          default:
            break
        }

        message.push(`${emoji} ${audit.title}`)

        message.push(chalk.gray(`${audit.desc}`))

        if (audit.detail) {
          if (audit.detail.type === 'list' && audit.detail.items.length > 0) {
            message.push(``)
            message.push(
              table(
                audit.detail.items.map((item) => ['*', formatVariable(item)]),
                {
                  border: getBorderCharacters(`void`),
                  drawHorizontalLine: () => false,
                  columnDefault: {
                    width: 70,
                  },
                  columns: [{ width: 1 }],
                },
              ),
            )
          } else if (audit.detail.type === 'table' && audit.detail.items.length > 0) {
            const tableData: string[][] = []
            const columnCount = audit.detail.headings.length
            tableData.push(['', ...audit.detail.headings.map((heading) => heading.name)])
            for (const item of audit.detail.items) {
              tableData.push(['*', ...audit.detail.headings.map((heading) => item[heading.key]).map(formatVariable)])
            }
            message.push(``)
            message.push(
              table(tableData, {
                border: getBorderCharacters(`void`),
                drawHorizontalLine: () => false,
                columnDefault: {
                  width: Math.floor(70 / columnCount),
                },
                columns: [{ width: 1 }],
              }),
            )
          }
        }

        tableData.push([message.join('\n')])
      }
    } else {
      tableData.push([chalk.green(`All audits passed`)])
    }
  }

  if (entryPoints.length > showLength) {
    tableData.push([`... and ${entryPoints.length - showLength} more entry points.`])
  }

  return table(tableData, {
    columns: [{ width: 90 }],
    header: {
      alignment: 'center',
      content: `Bundle audit score: ${bundleScore}`,
    },
  })
}

function formatVariable(v: any) {
  if (typeof v === 'object' && typeof v.raw === 'number') {
    return PrettyBytes.stringify(v.raw)
  }
  return v.toString()
}
