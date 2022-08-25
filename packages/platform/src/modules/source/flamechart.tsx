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

import { DefaultButton } from '@fluentui/react'
import { useModule, useModuleState } from '@sigi/react'
import { memo, useCallback, useEffect, useMemo } from 'react'

import { SharedColors } from '@perfsee/dls'
import { buildProfileFromFlameChartData, FlamechartContainer, Timing } from '@perfsee/flamechart'
import { MetricType } from '@perfsee/shared'

import { FlamechartModule, FlamechartPlaceholder } from '../flamechart'
import { ProjectModule } from '../shared'

import { SourceIssue } from './source.module'

function getTimingsFromMetric(name: MetricType, value: number): Timing | null {
  value *= 1000
  switch (name as MetricType) {
    case MetricType.FCP:
      return {
        name: 'FCP',
        value,
        color: SharedColors.greenCyan10,
      }
    case MetricType.FMP:
      return {
        name: 'FMP',
        value,
        color: SharedColors.green10,
      }
    case MetricType.LCP:
      return {
        name: 'LCP',
        value,
        color: SharedColors.green20,
      }
    case MetricType.TTI:
      return {
        name: 'TTI',
        value,
        color: SharedColors.red10,
      }
    default:
      return null
  }
}

export const FlamechartView: React.FunctionComponent<{ issue: SourceIssue }> = memo(({ issue }) => {
  const {
    frameKey,
    snapshotReport: { id: reportId, flameChartStorageKey },
  } = issue
  const [{ flamechart, metrics, loadingFlamechart, loadingMetrics }, dispatcher] = useModule(FlamechartModule)
  const project = useModuleState(ProjectModule, {
    selector: (s) => s.project,
    dependencies: [],
  })

  const onReload = useCallback(() => {
    if (project) {
      dispatcher.fetchFlamechartData(flameChartStorageKey!)
      dispatcher.fetchMetrics({ reportId, projectId: project.id })
    }
    return dispatcher.reset
  }, [dispatcher, flameChartStorageKey, reportId, project])

  useEffect(() => {
    return onReload()
  }, [onReload])

  const profile = useMemo(() => {
    return flamechart && buildProfileFromFlameChartData(flamechart)
  }, [flamechart])

  const timings = useMemo<Timing[] | undefined>(() => {
    if (!metrics) return
    return Object.keys(metrics)
      .map((key) => getTimingsFromMetric(key as MetricType, metrics![key]))
      .filter((v) => !!v) as Timing[]
  }, [metrics])

  return (
    <>
      {profile ? (
        <FlamechartContainer timings={timings} profile={profile} focusedFrame={{ key: frameKey }} />
      ) : (
        <FlamechartPlaceholder>
          {loadingFlamechart || loadingMetrics ? 'Loading' : <DefaultButton onClick={onReload}>Reload</DefaultButton>}
        </FlamechartPlaceholder>
      )}
    </>
  )
})
