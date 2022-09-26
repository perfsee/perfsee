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

import { pad, padEnd, padStart, truncate, TruncateOptions } from 'lodash'

import { Artifact } from '@perfsee/platform-server/db'
import { BundleJobUpdate, isPassedBundleJobUpdate } from '@perfsee/server-common'
import { PrettyBytes } from '@perfsee/shared'

import { BundleCompletedAction } from '../../types'

export function renderBundleOutput(
  { artifact, baselineArtifact, bundleJobResult }: BundleCompletedAction,
  link: string,
): {
  title: string
  summary: string
} {
  const bundleBasicContent = `### **[Bundle ${artifact.name}](${link})**\n\n\n`
  if (artifact.failed()) {
    return {
      title: 'Bundle Analysis Job Failed',
      summary: `${bundleBasicContent}**Failed Reason:**\n\n\n${artifact.failedReason}`,
    }
  } else {
    return {
      title: 'Bundle Analysis Job Finished',
      summary: `${bundleBasicContent}${bundleSizeDiffTable(bundleJobResult, artifact, baselineArtifact)}`,
    }
  }
}

function bundleSizeDiffTable(update: BundleJobUpdate, artifact: Artifact, baselineArtifact?: Artifact) {
  if (!isPassedBundleJobUpdate(update)) {
    return ''
  }
  const { entryPoints } = update
  const row = (start: string, c1: string, c2: string, c3: string, c4: string, end: string) =>
    padEnd(start, 2, ' ') +
    padEnd(c1, 12, ' ') +
    padStart(c2, 15, ' ') +
    padStart(c3, 15, ' ') +
    padStart(c4, 20, ' ') +
    ' ' +
    padStart(end, 2, ' ') +
    '\n'

  const diffRow = (
    name: string,
    baseline: number | undefined | null,
    current: number,
    isBytes = true,
    lessIsGood = true,
  ) => {
    let good
    if (typeof baseline !== 'number') {
      good = ''
    } else if (baseline === current) {
      good = '='
    } else {
      if (lessIsGood) {
        good = baseline > current ? '>' : '<'
      } else {
        good = baseline < current ? '>' : '<'
      }
    }

    let percentile
    if (typeof baseline !== 'number' || baseline === current) {
      percentile = ''
    } else if (baseline === 0) {
      percentile = `> 100%`
    } else {
      const percentile_num = (Math.abs(current - baseline) / baseline) * 100
      percentile = percentile_num > 1000 ? `> 1000%` : `${baseline > current ? '-' : '+'}${percentile_num.toFixed(2)}%`
    }

    if (typeof baseline !== 'number') {
      return row('', name, '?', !isBytes ? current.toString() : PrettyBytes.create(current).toString(), '', '')
    } else {
      let diff
      if (current === baseline) {
        diff = ''
      } else if (isBytes) {
        diff = PrettyBytes.create(current - baseline, { signed: true }) + `(${percentile})`
      } else if (current > baseline) {
        diff = `+${current - baseline}`
      } else {
        diff = `-${Math.abs(current - baseline)}`
      }
      return row(
        good,
        name,
        !isBytes ? baseline.toString() : PrettyBytes.create(baseline).toString(),
        !isBytes ? current.toString() : PrettyBytes.create(current).toString(),
        diff,
        '',
      )
    }
  }

  let table = '```diff\n'
  table += `diff ------------------- Bundle Size Diff -------------------------\n\n`

  for (const name of Object.keys(entryPoints!).slice(0, 3)) {
    const entry = entryPoints![name]
    table += `@@  ${pad(`EntryPoint: ${name}`, 59, ' ')}  @@\n`
    table += row(
      '##',
      '',
      padStart(
        truncateLeft(baselineArtifact ? baselineArtifact.branch || baselineArtifact.hash.substring(0, 7) : '?', {
          length: 14,
          omission: '…',
        }),
        15,
        ' ',
      ),
      padStart(truncateLeft(artifact.branch || artifact.hash.substring(0, 7), { length: 14, omission: '…' }), 15, ' '),
      '+/-',
      '##',
    )
    table += '===================================================================\n'
    table += diffRow('Bundle', entry.sizeDiff.baseline?.raw, entry.sizeDiff.current.raw)
    table += diffRow('Initial JS', entry.initialJsSizeDiff.baseline?.raw, entry.initialJsSizeDiff.current.raw)
    table += diffRow('Initial CSS', entry.initialCssSizeDiff.baseline?.raw, entry.initialCssSizeDiff.current.raw)
    table += `#~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~#\n`
    table += diffRow('Assets', entry.assetsCountDiff.baseline, entry.assetsCountDiff.current, false)
    table += diffRow('Chunks', entry.chunksCountDiff.baseline, entry.chunksCountDiff.current, false)
    table += diffRow('Packages', entry.packagesCountDiff.baseline, entry.packagesCountDiff.current, false)
    table += diffRow(
      'Duplicates',
      entry.duplicatedPackagesCountDiff.baseline,
      entry.duplicatedPackagesCountDiff.current,
      false,
    )

    if (entry.warnings.length) {
      table += `#~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Warnings ~~~~~~~~~~~~~~~~~~~~~~~~~~~#\n`
      for (const warning of entry.warnings) {
        table += `! ${padEnd(truncate(warning.rule, { length: 64 }), 65, ' ')}\n`
      }
    }

    table += '\n\n'
  }

  if (Object.keys(entryPoints!).length > 3) {
    table += '...and more\n'
  }

  table += '```\n'

  return table
}

function truncateLeft(str: string, options?: TruncateOptions) {
  return truncate(str.split('').reverse().join(''), options).split('').reverse().join('')
}
