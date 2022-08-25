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

import { isNumber, round } from 'lodash'

import templates from '@perfsee/email-templates'
import { SnapshotReport } from '@perfsee/platform-server/db'
import { SnapshotStatus } from '@perfsee/server-common'
import { MetricType } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { SendMailOptions } from '../../../email'
import { formatTime } from '../../shared'
import { LabNotificationInfo } from '../../type'

import { compileEmailTemplate } from './utils'

const template = compileEmailTemplate(templates.lab)

export function labEmailTemplate(
  { snapshot, project, reports }: LabNotificationInfo,
  host: string,
): Omit<SendMailOptions, 'to'> {
  if (!reports.length) {
    throw new Error('Reports should not be empty')
  }

  const statusMessage = 'Performance Issue Scanning completed'
  const title = `[${project.namespace}/${project.name}] ${statusMessage}`
  const firstReport = reports[0]

  const reportLink =
    host +
    pathFactory.project.lab.report({
      projectId: project.slug,
      reportId: firstReport.iid,
      tabName: 'overview',
    })

  return {
    subject: title,
    text: title + '\n' + 'see details at ' + reportLink,
    html: template({
      env: {
        host: host + pathFactory.home(),
      },
      title,
      statusMessage,
      snapshotId: snapshot.id,
      commit: snapshot.hash,
      createdAt: snapshot.createdAt,
      reportLink,
      reports: reports.map((report) => {
        const { page, profile } = report
        const FCP = report.metrics[MetricType.FCP]
        const LCP = report.metrics[MetricType.LCP]
        const TTI = report.metrics[MetricType.TTI]
        const CLS = report.metrics[MetricType.CLS]
        const score = getSnapshotScore(report)
        return {
          icon: getSnapshotStatusIcon(report),
          FCP: isNumber(FCP) ? formatTime(FCP) : '-',
          LCP: isNumber(LCP) ? formatTime(LCP) : '-',
          TTI: isNumber(TTI) ? formatTime(TTI) : '-',
          CLS: isNumber(CLS) ? round(CLS, 3) : '-',
          pageName: page.name,
          profileName: profile.name,
          reportLink,
          scoreBorderColor: score.borderColor,
          scoreBackgroundColor: score.backgroundColor,
          scoreText: score.text,
          scoreColor: score.color,
        }
      }),
    }),
  }
}

function getSnapshotStatusIcon(report: SnapshotReport) {
  switch (report.status) {
    case SnapshotStatus.Completed:
      return report.performanceScore! > 60 ? '👍' : '👎'
    case SnapshotStatus.Failed:
      return '❌'
    default:
      return '⚠️'
  }
}

function getSnapshotScore(report: SnapshotReport) {
  if (report.status === SnapshotStatus.Completed && report.performanceScore) {
    const score = report.performanceScore
    const color = score < 50 ? '209, 52, 56' : score < 90 ? '255, 170, 68' : '0, 173, 86'
    return {
      borderColor: `rgb(${color})`,
      backgroundColor: `rgba(${color}, 0.1)`,
      color: `rgb(${color})`,
      text: score,
    }
  } else {
    return {
      borderColor: `rgba(209, 52, 56, 0.1)`,
      backgroundColor: `rgba(209, 52, 56, 0.1)`,
      color: `rgb(209, 52, 56)`,
      text: '-',
    }
  }
}
