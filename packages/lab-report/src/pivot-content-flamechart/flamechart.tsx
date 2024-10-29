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
import { memo, useCallback, useEffect, useMemo } from 'react'

import { ReactLogoIcon } from '@perfsee/components'
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
  buildTimelineProfilesFromReactDevtoolProfileData,
  FlamechartFrame,
  FlamechartImage,
  PerfseeFlameChartData,
  ReactDevtoolProfilingDataExport,
  prepareProfilingDataFrontendFromExport,
} from '@perfsee/flamechart'
import { FlamechartBindingManager } from '@perfsee/flamechart/views/flamechart-binding-manager'
import { LighthouseScoreType, MetricScoreSchema, RequestSchema, UserTimingSchema } from '@perfsee/shared'
import { Task } from '@perfsee/tracehouse'

import { FlamechartModule, FlamechartPlaceholder } from '../flamechart'
import { ReactFlameGraphModule } from '../pivot-content-react/module'

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

const reactLogoImage = FlamechartImage.createFromSvgStr(
  'react-logo',
  `<svg xmlns="http://www.w3.org/2000/svg" width="649px" height="577px" viewBox="-11.5 -10.23174 23 20.46348">
<title>React Logo</title>
<circle cx="0" cy="0" r="2.05" fill="#ffffff"/>
<g stroke="#ffffff" stroke-width="1" fill="none">
  <ellipse rx="11" ry="4.2"/>
  <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
  <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
</g></svg>`,
)

const images = [reactLogoImage]

const FLAME_CHART_LOCAL_STORAGE_KEY = 'perfsee_flamechart_config_v1'
const getStorageKey = (flamechartLink: string) => flamechartLink.split('/').slice(-1)[0].split('.')[0]

export const FlamechartView: React.FunctionComponent<{
  flameChartLink: string
  reactProfileLink: string | null
  requests: RequestSchema[]
  requestsBaseTimestamp?: number
  tasks?: Task[]
  tasksBaseTimestamp?: number
  metrics?: MetricScoreSchema[]
  userTimings?: UserTimingSchema[]
  onSelectFrame?: (frame: FlamechartFrame | null) => void
  onClickTiming?: (click: { timing: Timing; event: MouseEvent } | null) => void
  focusedFrame?: { key: string; parentKeys?: string[] }
  flamechartData?: PerfseeFlameChartData
  reactProfileData?: ReactDevtoolProfilingDataExport
  disableFetch?: boolean
  bindingManager?: FlamechartBindingManager
  initialRight?: number
  FlamechartModule?: typeof FlamechartModule
  ReactFlameGraphModule?: typeof ReactFlameGraphModule
  showProfiles?: string[]
  initCollapsed?: (boolean | undefined)[]
  useSimpleDetailView?: boolean
}> = memo(
  ({
    flameChartLink,
    reactProfileLink,
    requests,
    requestsBaseTimestamp,
    tasks,
    tasksBaseTimestamp,
    metrics,
    userTimings,
    onSelectFrame,
    onClickTiming,
    focusedFrame,
    flamechartData,
    reactProfileData,
    disableFetch,
    bindingManager,
    initialRight: propInitialRight,
    FlamechartModule: propFlamechartModule,
    ReactFlameGraphModule: propReactFlameGraphModule,
    showProfiles,
    initCollapsed: propInitCollapsed,
    useSimpleDetailView,
  }) => {
    const [{ flamechart }, dispatcher] = useModule(propFlamechartModule || FlamechartModule)
    const [{ reactProfile }, reactFlameDispatcher] = useModule(propReactFlameGraphModule || ReactFlameGraphModule)

    useEffect(() => {
      if (disableFetch) {
        reactProfileData &&
          reactFlameDispatcher.setReactProfile(prepareProfilingDataFrontendFromExport(reactProfileData))
      } else if (reactProfileLink) {
        reactFlameDispatcher.fetchReactProfileData(reactProfileLink)
      }
      return reactFlameDispatcher.reset
    }, [reactProfileLink, reactFlameDispatcher, disableFetch, reactProfileData])

    useEffect(() => {
      if (disableFetch) {
        flamechartData && dispatcher.setFlamechart(flamechartData)
      } else {
        dispatcher.fetchFlamechartData(flameChartLink)
      }
      return dispatcher.reset
    }, [dispatcher, flameChartLink, flamechartData, disableFetch])

    const onSplitChange = useCallback(
      (collapsed: (boolean | undefined)[], sizes: number[]) => {
        try {
          const storageConfig = JSON.parse(localStorage.getItem(FLAME_CHART_LOCAL_STORAGE_KEY) || '{}')
          localStorage.setItem(
            FLAME_CHART_LOCAL_STORAGE_KEY,
            JSON.stringify({ ...storageConfig, [getStorageKey(flameChartLink)]: [collapsed, sizes] }),
          )
        } catch (e) {
          try {
            localStorage.removeItem(FLAME_CHART_LOCAL_STORAGE_KEY)
          } catch {
            //
          }
        }
      },
      [flameChartLink],
    )
    const [initCollapsed, initSplitSizes] = useMemo(() => {
      if (propInitCollapsed) {
        return propInitCollapsed
      }
      try {
        const storageConfig = JSON.parse(localStorage.getItem(FLAME_CHART_LOCAL_STORAGE_KEY) || '{}')
        const storageKey = getStorageKey(flameChartLink)
        return [storageConfig[storageKey]?.[0], storageConfig[storageKey]?.[1]]
      } catch {
        return []
      }
    }, [flameChartLink, propInitCollapsed])

    const flamechartTimeOffset = requestsBaseTimestamp && flamechart ? requestsBaseTimestamp - flamechart.startTime : 0
    const tasksTimeOffset = requestsBaseTimestamp && tasksBaseTimestamp ? requestsBaseTimestamp - tasksBaseTimestamp : 0
    const reactTimeOffset = useMemo(() => {
      return (
        (userTimings
          ? userTimings.find(
              (timing) => timing.name.startsWith('--schedule-render') || timing.name.startsWith('--render-start-1'),
            )?.timestamp ?? 10000
          : 10000) - 10000
      )
    }, [userTimings])

    const profile = useMemo(() => {
      return flamechart && buildProfileFromFlameChartData(flamechart, -flamechartTimeOffset)
    }, [flamechart, flamechartTimeOffset])

    const reactSchedulingEventsProfiles = useMemo(() => {
      return reactProfile && buildTimelineProfilesFromReactDevtoolProfileData(reactProfile, reactTimeOffset)
    }, [reactProfile, reactTimeOffset])

    const tasksProfile = useMemo(() => {
      if (!tasks) {
        return undefined
      }

      return buildProfileFromTracehouse(
        tasks,
        -tasksTimeOffset,
        (task) => task.kind !== 'other' && task.kind !== 'scriptEvaluation' && task.kind !== 'garbageCollection',
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

    const reactTimings = useMemo<Timing[] | undefined>(() => {
      return reactProfile?.timelineData.flatMap((data) => {
        const schedulingEvents = data.schedulingEvents.map((e) => {
          const [componentName, locationId] = e.componentName?.split('@locationId:') ?? []

          const parsedLocation =
            (typeof locationId === 'string' && reactProfile.parsedLocations?.[Number(locationId)]) || null
          const name = parsedLocation?.name || componentName

          return {
            name: '[img:react-logo]' + (name ? `${name} ${e.type}` : e.type),
            value: e.timestamp * 1000 + reactTimeOffset,
            color: SharedColors.cyan10,
            style: 'point' as const,
            file: parsedLocation
              ? `${parsedLocation.file}:${parsedLocation.line}:${parsedLocation.col}`
              : typeof locationId === 'string' && reactProfile.fiberLocations
              ? reactProfile.fiberLocations[locationId]
              : '',
          }
        })

        const throwErrorEvents = data.thrownErrors.map((e) => {
          const [componentName, locationId] = e.componentName?.split('@locationId:') ?? []

          const parsedLocation =
            (typeof locationId === 'string' && reactProfile.parsedLocations?.[Number(locationId)]) || null
          const name = parsedLocation?.name || componentName

          return {
            name:
              '[img:react-logo]' + (name ? `${name} throw error during ${e.phase}` : `throw error during ${e.phase}`),
            value: e.timestamp * 1000 + reactTimeOffset,
            color: SharedColors.red10,
            style: 'point' as const,
            file: parsedLocation
              ? `${parsedLocation.file}:${parsedLocation.line}:${parsedLocation.col}`
              : typeof locationId === 'string' && reactProfile.fiberLocations
              ? reactProfile.fiberLocations[locationId]
              : '',
          }
        })

        return schedulingEvents.concat(throwErrorEvents)
      })
    }, [reactProfile, reactTimeOffset])

    const userTimingsProfile = useMemo(() => {
      const userTimingsHasDuration = userTimings?.filter((timing) => timing.duration)
      if (!userTimingsHasDuration?.length) return
      return buildProfileFromUserTimings(userTimingsHasDuration)
    }, [userTimings])

    const tti = useMemo(() => metrics?.find((score) => score.id === LighthouseScoreType.TTI)?.value, [metrics])
    const initialRight = propInitialRight ?? (tti ? (tti + 500) * 1000 : undefined)

    const profiles = useMemo(() => {
      return (
        // wait for async loading profile
        profile &&
        ([
          ...(reactSchedulingEventsProfiles?.map((p) => ({
            name: (
              <>
                <ReactLogoIcon /> React
              </>
            ),
            profile: p,
            flamechartFactory: 'react-timeline',
            grow: 0.1,
            theme: lightTheme,
          })) || []),
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
        ].filter((profile) => {
          return !!profile && (showProfiles ? showProfiles.includes(profile.name as string) : true)
        }) as FlamechartGroupContainerProps['profiles'])
      )
    }, [networkProfile, profile, tasksProfile, userTimingsProfile, reactSchedulingEventsProfiles, showProfiles])

    if (!profiles) {
      return <FlamechartPlaceholder>Loading</FlamechartPlaceholder>
    }

    if (profiles.length === 1) {
      return (
        <FlamechartContainer
          {...profiles[0]}
          timings={timings}
          initialRight={initialRight}
          onSelectFrame={onSelectFrame}
          onClickTiming={onClickTiming}
          focusedFrame={focusedFrame}
          bindingManager={bindingManager}
          useSimpleDetailView={useSimpleDetailView}
        />
      )
    }

    return (
      <>
        <FlamechartGroupContainer
          profiles={profiles}
          timings={timings?.concat(reactTimings || [])}
          initialRight={initialRight}
          onSelectFrame={onSelectFrame}
          images={images}
          onClickTiming={onClickTiming}
          focusedFrame={focusedFrame}
          onSplitChange={onSplitChange}
          initCollapsed={initCollapsed}
          initSplitSizes={initSplitSizes}
          bindingManager={bindingManager}
          useSimpleDetailView={useSimpleDetailView}
        />
      </>
    )
  },
)
