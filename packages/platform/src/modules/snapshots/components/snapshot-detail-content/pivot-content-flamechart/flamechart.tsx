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

import { SharedColors } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { memo, useEffect, useMemo } from 'react'

import { useWideScreen } from '@perfsee/components'
import {
  buildProfileFromFlameChartData,
  buildProfileFromNetworkRequests,
  buildProfileFromTracehouse,
  FlamechartGroupContainer,
  lightGrayTheme,
  lightTheme,
  Timing,
  FlamechartGroupContainerProps,
  FlamechartContainer,
  buildProfileFromUserTimings,
} from '@perfsee/flamechart'
import { FlamechartModule, FlamechartPlaceholder } from '@perfsee/platform/modules/flamechart'
import { LighthouseScoreType, MetricScoreSchema, RequestSchema, UserTimingSchema } from '@perfsee/shared'
import { Task } from '@perfsee/tracehouse'

function getTimingsFromMetric(name: LighthouseScoreType, value: number): Timing | null {
  value *= 1000
  switch (name) {
    case LighthouseScoreType.FCP:
      return {
        name: 'FCP',
        value,
        color: SharedColors.greenCyan10,
      }
    case LighthouseScoreType.FMP:
      return {
        name: 'FMP',
        value,
        color: SharedColors.green10,
      }
    case LighthouseScoreType.LCP:
      return {
        name: 'LCP',
        value,
        color: SharedColors.green20,
      }
    case LighthouseScoreType.TTI:
      return {
        name: 'TTI',
        value,
        color: SharedColors.red10,
      }
    default:
      return null
  }
}

export const FlamechartView: React.FunctionComponent<{
  flameChartLink: string
  requests: RequestSchema[]
  requestsBaseTimestamp?: number
  tasks?: Task[]
  tasksBaseTimestamp?: number
  metrics?: MetricScoreSchema[]
  userTimings?: UserTimingSchema[]
}> = memo(({ flameChartLink, requests, requestsBaseTimestamp, tasks, tasksBaseTimestamp, metrics, userTimings }) => {
  useWideScreen()
  const [{ flamechart }, dispatcher] = useModule(FlamechartModule)

  useEffect(() => {
    dispatcher.fetchFlamechartData(flameChartLink)
    return dispatcher.reset
  }, [dispatcher, flameChartLink])

  const flamechartTimeOffset = requestsBaseTimestamp && flamechart ? requestsBaseTimestamp - flamechart.startTime : 0
  const tasksTimeOffset = requestsBaseTimestamp && tasksBaseTimestamp ? requestsBaseTimestamp - tasksBaseTimestamp : 0

  const profile = useMemo(() => {
    return flamechart && buildProfileFromFlameChartData(flamechart, -flamechartTimeOffset)
  }, [flamechart, flamechartTimeOffset])

  const tasksProfile = useMemo(() => {
    return (
      tasks &&
      buildProfileFromTracehouse(
        tasks,
        -tasksTimeOffset,
        (task) => task.kind !== 'other' && task.kind !== 'scriptEvaluation' && task.kind !== 'garbageCollection',
      )
    )
  }, [tasks, tasksTimeOffset])

  const networkProfile = useMemo(() => {
    return requests && buildProfileFromNetworkRequests(requests as RequestSchema[])
  }, [requests])

  const timings = useMemo<Timing[] | undefined>(() => {
    if (!metrics) return
    return metrics
      .map((metric) => metric.value && getTimingsFromMetric(metric.id, metric.value))
      .filter(Boolean) as Timing[]
  }, [metrics])

  const userTimingsProfile = useMemo(() => {
    if (!userTimings?.length) return
    return buildProfileFromUserTimings(userTimings)
  }, [userTimings])

  const tti = useMemo(() => metrics?.find((score) => score.id === LighthouseScoreType.TTI)?.value, [metrics])
  const initialRight = tti ? (tti + 500) * 1000 : undefined

  const profiles = useMemo(() => {
    return (
      // wait for async loading profile
      profile &&
      ([
        userTimingsProfile && {
          name: 'Timings',
          profile: userTimingsProfile,
          flamechartFactory: 'network' as const,
          grow: 0.1,
          theme: lightTheme,
        },
        networkProfile && {
          name: 'Network',
          profile: networkProfile,
          flamechartFactory: 'network' as const,
          grow: 0.1,
          theme: lightGrayTheme,
        },
        tasksProfile && { name: 'Tasks', profile: tasksProfile, grow: 0.1 },
        { name: 'Main', profile: profile, grow: 1 },
      ].filter(Boolean) as FlamechartGroupContainerProps['profiles'])
    )
  }, [networkProfile, profile, tasksProfile, userTimingsProfile])

  if (!profiles) {
    return <FlamechartPlaceholder>Loading</FlamechartPlaceholder>
  }

  if (profiles.length === 1) {
    return <FlamechartContainer {...profiles[0]} timings={timings} initialRight={initialRight} />
  }

  return (
    <>
      <FlamechartGroupContainer profiles={profiles} timings={timings} initialRight={initialRight} />
    </>
  )
})
