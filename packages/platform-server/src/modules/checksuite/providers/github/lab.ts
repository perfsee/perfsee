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

import { padEnd, padStart, truncate } from 'lodash'

import { SnapshotReport } from '@perfsee/platform-server/db'
import { SnapshotStatus } from '@perfsee/server-common'

import { LabCompletedAction } from '../../types'

export function renderLabOutput(
  action: LabCompletedAction,
  link: string,
): {
  title: string
  summary: string
} {
  const title = `### **[${action.snapshot.title ? `Lab ${action.snapshot.title}` : 'Lab'}](${link})**\n\n\n`

  return {
    title: 'Performance Issue Scanning completed',
    summary: `${title}${action.reports.length > 0 ? labResultTable(action.reports) : 'Snapshot is empty.'}`,
  }
}

function labResultTable(reports: SnapshotReport[]) {
  let table = '```diff\n'
  table += `@@                        Snapshot Result                        @@\n`
  table += `## Page (Profile)                               Score    Status  ##\n`
  table += `===================================================================\n`

  for (const report of reports) {
    table += `${getScoreColor(report)} ${padEnd(truncate(report.page.name, { length: 45 }), 45, ' ')} ${padStart(
      report.performanceScore?.toString() ?? '-',
      5,
      ' ',
    )}        ${getStatusIcon(report)}    \n`
  }

  table += '\n'
  table += '```\n'

  return table
}

function getStatusIcon(report: SnapshotReport) {
  switch (report.status) {
    case SnapshotStatus.Completed:
      return '✅'
    case SnapshotStatus.Failed:
      return '❌'
    default:
      return '⚠️'
  }
}

function getScoreColor(report: SnapshotReport) {
  if (!report.performanceScore) {
    return ' '
  } else if (report.performanceScore < 50) {
    return '-'
  } else if (report.performanceScore < 90) {
    return '!'
  } else {
    return '+'
  }
}
