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
import type { ProfilingDataForRootFrontend, ProfilingDataFrontend, TimelineData } from 'react-devtools-inline'

import type { PerfseeFlameChartData, Frame } from '@perfsee/flamechart'

export interface FlameChartDiagnostic {
  code: string
  frame: Frame
  info: FlameChartDiagnosticInfo
  bundleHash?: string
}

export interface FlameChartDiagnosticInfo {
  unit: 'us'
  value: number
  isSource?: boolean
}

export type FlameChartData = PerfseeFlameChartData

export type ReactTimelineData = TimelineData

export type {
  ReactComponentMeasure,
  SuspenseEvent,
  CommitDataFrontend,
  ProfilingDataForRootFrontend,
  ProfilingDataFrontend,
} from 'react-devtools-inline'

const PROFILER_EXPORT_VERSION = 5

// Serializable version of ProfilingDataFrontend data.
export type ProfilingDataExport = {
  version: 5

  // Legacy profiling data is per renderer + root.
  dataForRoots: Array<any>

  // Timeline data is per rederer.
  // Note that old exported profiles won't contain this key.
  timelineData?: Array<any>
}

// Converts a Profiling data export into the format required by the Store.
export function prepareProfilingDataFrontendFromExport(
  profilingDataExport: ProfilingDataExport,
): ProfilingDataFrontend {
  const { version } = profilingDataExport

  if (version !== PROFILER_EXPORT_VERSION) {
    throw Error(`Unsupported profile export version "${version}". Supported version is "${PROFILER_EXPORT_VERSION}".`)
  }

  const timelineData: Array<TimelineData> = profilingDataExport.timelineData
    ? profilingDataExport.timelineData.map(
        ({
          batchUIDToMeasuresKeyValueArray,
          componentMeasures,
          duration,
          flamechart,
          internalModuleSourceToRanges,
          laneToLabelKeyValueArray,
          laneToReactMeasureKeyValueArray,
          nativeEvents,
          networkMeasures,
          otherUserTimingMarks,
          reactVersion,
          schedulingEvents,
          snapshots,
          snapshotHeight,
          startTime,
          suspenseEvents,
          thrownErrors,
        }) => ({
          // Most of the data is safe to parse as-is,
          // but we need to convert the nested Arrays back to Maps.
          batchUIDToMeasuresMap: new Map(batchUIDToMeasuresKeyValueArray),
          componentMeasures,
          duration,
          flamechart,
          internalModuleSourceToRanges: new Map(internalModuleSourceToRanges),
          laneToLabelMap: new Map(laneToLabelKeyValueArray),
          laneToReactMeasureMap: new Map(laneToReactMeasureKeyValueArray),
          nativeEvents,
          networkMeasures,
          otherUserTimingMarks,
          reactVersion,
          schedulingEvents,
          snapshots,
          snapshotHeight,
          startTime,
          suspenseEvents,
          thrownErrors,
        }),
      )
    : []

  const dataForRoots: Map<number, ProfilingDataForRootFrontend> = new Map()
  profilingDataExport.dataForRoots.forEach(
    ({ commitData, displayName, initialTreeBaseDurations, operations, rootID, snapshots }) => {
      dataForRoots.set(rootID, {
        commitData: commitData.map(
          ({
            changeDescriptions,
            duration,
            effectDuration,
            fiberActualDurations,
            fiberSelfDurations,
            passiveEffectDuration,
            priorityLevel,
            timestamp,
            updaters,
          }: any) => ({
            changeDescriptions: changeDescriptions != null ? new Map(changeDescriptions) : null,
            duration,
            effectDuration,
            fiberActualDurations: new Map(fiberActualDurations),
            fiberSelfDurations: new Map(fiberSelfDurations),
            passiveEffectDuration,
            priorityLevel,
            timestamp,
            updaters,
          }),
        ),
        displayName,
        initialTreeBaseDurations: new Map(initialTreeBaseDurations),
        operations,
        rootID,
        snapshots: new Map(snapshots),
      })
    },
  )

  return {
    dataForRoots,
    imported: true,
    timelineData,
  }
}

// Converts a Store Profiling data into a format that can be safely (JSON) serialized for export.
export function prepareProfilingDataExport(profilingDataFrontend: ProfilingDataFrontend): ProfilingDataExport {
  const timelineData = profilingDataFrontend.timelineData.map(
    ({
      batchUIDToMeasuresMap,
      componentMeasures,
      duration,
      flamechart,
      internalModuleSourceToRanges,
      laneToLabelMap,
      laneToReactMeasureMap,
      nativeEvents,
      networkMeasures,
      otherUserTimingMarks,
      reactVersion,
      schedulingEvents,
      snapshots,
      snapshotHeight,
      startTime,
      suspenseEvents,
      thrownErrors,
    }) => ({
      // Most of the data is safe to serialize as-is,
      // but we need to convert the Maps to nested Arrays.
      batchUIDToMeasuresKeyValueArray: Array.from(batchUIDToMeasuresMap.entries()),
      componentMeasures: componentMeasures,
      duration,
      flamechart,
      internalModuleSourceToRanges: Array.from(internalModuleSourceToRanges.entries()),
      laneToLabelKeyValueArray: Array.from(laneToLabelMap.entries()),
      laneToReactMeasureKeyValueArray: Array.from(laneToReactMeasureMap.entries()),
      nativeEvents,
      networkMeasures,
      otherUserTimingMarks,
      reactVersion,
      schedulingEvents,
      snapshots,
      snapshotHeight,
      startTime,
      suspenseEvents,
      thrownErrors,
    }),
  )

  const dataForRoots: any[] = []
  profilingDataFrontend.dataForRoots.forEach(
    ({ commitData, displayName, initialTreeBaseDurations, operations, rootID, snapshots }) => {
      dataForRoots.push({
        commitData: commitData.map(
          ({
            changeDescriptions,
            duration,
            effectDuration,
            fiberActualDurations,
            fiberSelfDurations,
            passiveEffectDuration,
            priorityLevel,
            timestamp,
            updaters,
          }) => ({
            changeDescriptions: changeDescriptions != null ? Array.from(changeDescriptions.entries()) : null,
            duration,
            effectDuration,
            fiberActualDurations: Array.from(fiberActualDurations.entries()),
            fiberSelfDurations: Array.from(fiberSelfDurations.entries()),
            passiveEffectDuration,
            priorityLevel,
            timestamp,
            updaters,
          }),
        ),
        displayName,
        initialTreeBaseDurations: Array.from(initialTreeBaseDurations.entries()),
        operations,
        rootID,
        snapshots: Array.from(snapshots.entries()),
      })
    },
  )

  return {
    version: PROFILER_EXPORT_VERSION,
    dataForRoots,
    timelineData,
  }
}
