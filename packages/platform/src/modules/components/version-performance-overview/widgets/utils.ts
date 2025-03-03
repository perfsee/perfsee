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

import { PerformanceTabType } from '@perfsee/lab-report/snapshot-type'
import { formatTime } from '@perfsee/platform/common'
import { ReportNode } from '@perfsee/platform/modules/version-report/types'
import { LighthouseScoreType } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

export const PerformanceScoreColorMap = {
  none: {
    backgroundColor: '#F6F7FB',
    headColor: '#86909C',
    textColor: '#4E5969',
  },
  low: {
    backgroundColor: '#FFECE8',
    headColor: '#EB635E',
    textColor: '#E63F3F',
  },
  medium: {
    backgroundColor: '#FFFAE8',
    headColor: '#FBB02E',
    textColor: '#FA9600',
  },
  high: {
    backgroundColor: '#E8FFEA',
    headColor: '#22BB43',
    textColor: '#00AA2A',
  },
}

type ScoreMapKeys = keyof typeof PerformanceScoreColorMap

export const getScoreMapKey = (score: number | null): ScoreMapKeys => {
  if (!score) {
    return 'none'
  } else if (score < 50) {
    return 'low'
  } else if (score < 90) {
    return 'medium'
  }

  return 'high'
}

export const getScoreColors = (score: number | null) => {
  const key = getScoreMapKey(score)
  return PerformanceScoreColorMap[key]
}

export const getSnapshotReportURL = (projectId: string, report: ReportNode, tabName?: string) => {
  return pathFactory.project.lab.report({
    projectId,
    tabName: tabName ?? PerformanceTabType.Overview,
    reportId: report.id,
  })
}

export const PerformanceKeys = [
  {
    key: 'FCP',
    id: LighthouseScoreType.FCP,
  },
  {
    key: 'LCP',
    id: LighthouseScoreType.LCP,
  },
  {
    key: 'CLS',
    id: LighthouseScoreType.CLS,
  },
  {
    key: 'SI',
    id: LighthouseScoreType.SI,
  },
  {
    key: 'TBT',
    id: LighthouseScoreType.TBT,
  },
]

export const formatPerformanceValue = (value?: number, formatter?: 'duration' | 'unitless' | 'default') => {
  if (!value) {
    return ''
  }

  if (formatter === 'duration') {
    const { value: timeValue, unit } = formatTime(value)
    return `${timeValue} ${unit}`
  }

  return value
}
