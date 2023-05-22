import type { ProfilingDataForRootFrontend, TimelineData, TimelineDataExport } from 'react-devtools-inline'
import { ReactDevtoolProfilingDataFrontend } from './types'

const PROFILER_EXPORT_VERSION = 5

// Serializable version of ProfilingDataFrontend data.
export type ProfilingDataExport = {
  version: 5

  // Legacy profiling data is per renderer + root.
  dataForRoots: Array<any>

  // Timeline data is per renderer.
  // Note that old exported profiles won't contain this key.
  timelineData?: TimelineDataExport[]

  fiberLocations?: string[]

  parsedLocations?: {
    name: string
    file: string
    line: number
    col: number
  }[]
}

// Converts a Profiling data export into the format required by the Store.
export function prepareProfilingDataFrontendFromExport(
  profilingDataExport: ProfilingDataExport,
): ReactDevtoolProfilingDataFrontend {
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
    fiberLocations: profilingDataExport.fiberLocations,
    parsedLocations: profilingDataExport.parsedLocations,
  }
}
