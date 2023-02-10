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

import {
  ElementType,
  ProfilingDataBackend,
  ProfilingDataForRootFrontend,
  ProfilingDataFrontend,
  TimelineData,
} from 'react-devtools-inline'

const REACT_DOM_MODULE_REGEXP =
  /(?<moduleId>\w+|"\S+"):\s?(?<closure>(?:function\s?)?\(\w+,\w+,(?<getModule>\w+)\)\s?(?:=>)?\s?{(?:(?!((\w+|"\S+"):function\s?\(\w+,\w+,\w+)|react\.memo).)*?https:\/\/reactjs\.org\/docs\/error-decoder\.html.*rendererPackageName:\s?"react-dom".*?\w+\.version="(?<version>.*?)".*?})/

export function generateProfilingBundle(origin: string, reactDomProfiling: string, schedulerTracingProfiling: string) {
  const profilingBuildGetModuleIdentifier = /^function\(\w+,\w+,(\w+)\)/.exec(reactDomProfiling)?.[1]
  // ((?:var \w+)|(?:,\s?\w+))=n\((\d+|(?:".*?"))\)
  const profilingBuildGetModuleCallRegexp = new RegExp(
    `((?:var \\w+)|(?:,\\s?\\w+))=${profilingBuildGetModuleIdentifier}\\((\\d+|(?:".*?"))\\)`,
    'g',
  )
  const schedulerTracingWrapper = `(function(exports){${schedulerTracingProfiling}return exports;})({})`
  return origin.replace(REACT_DOM_MODULE_REGEXP, (_match, moduleId, closure, getModuleIdentifier, _version) => {
    const getModuleCallRegexp = new RegExp(
      `(?:(?:var \\w+)|(?:,\\s?\\w+))=${getModuleIdentifier}\\((\\d+|(?:".*?"))\\)`,
      'g',
    )
    const moduleIdReplacedText: string = reactDomProfiling.replaceAll(
      profilingBuildGetModuleCallRegexp,
      (_match, variable) => {
        const moduleId = getModuleCallRegexp.exec(closure)?.[1]
        if (!moduleId) {
          return `${variable}=${schedulerTracingWrapper}`
        }
        return `${variable}=${profilingBuildGetModuleIdentifier}(${moduleId})`
      },
    )
    return `${moduleId}:${moduleIdReplacedText}`
  })
}

export function detectReactDom(text: string) {
  return /rendererPackageName:\s?"react-dom"/.test(text)
}

export function isProfilingBuild(text: string) {
  return /injectProfilingHooks:/.test(text)
}

/**
 * from react-devtools-shared
 */
export function prepareProfilingDataFrontendFromBackendAndStore(
  dataBackends: Array<ProfilingDataBackend>,
  operationsByRootID: Map<number, Array<Array<number>>>,
): ProfilingDataFrontend {
  const dataForRoots: Map<number, ProfilingDataForRootFrontend> = new Map()

  const timelineDataArray: TimelineData[] = []

  dataBackends.forEach((dataBackend) => {
    const { timelineData } = dataBackend
    if (timelineData != null) {
      const {
        batchUIDToMeasuresKeyValueArray,
        internalModuleSourceToRanges,
        laneToLabelKeyValueArray,
        laneToReactMeasureKeyValueArray,
        ...rest
      } = timelineData

      timelineDataArray.push({
        ...rest,

        // Most of the data is safe to parse as-is,
        // but we need to convert the nested Arrays back to Maps.
        batchUIDToMeasuresMap: new Map(batchUIDToMeasuresKeyValueArray),
        internalModuleSourceToRanges: new Map(internalModuleSourceToRanges),
        laneToLabelMap: new Map(laneToLabelKeyValueArray),
        laneToReactMeasureMap: new Map(laneToReactMeasureKeyValueArray),
      })
    }

    dataBackend.dataForRoots.forEach(({ commitData, displayName, initialTreeBaseDurations, rootID }) => {
      const operations = operationsByRootID.get(rootID)
      if (operations == null) {
        throw Error(`Could not find profiling operations for root "${rootID}"`)
      }

      // Do not filter empty commits from the profiler data!
      // Hiding "empty" commits might cause confusion too.
      // A commit *did happen* even if none of the components the Profiler is showing were involved.
      const convertedCommitData = commitData.map((commitDataBackend, _commitIndex) => ({
        changeDescriptions:
          commitDataBackend.changeDescriptions != null ? new Map(commitDataBackend.changeDescriptions) : null,
        duration: commitDataBackend.duration,
        effectDuration: commitDataBackend.effectDuration,
        fiberActualDurations: new Map(commitDataBackend.fiberActualDurations),
        fiberSelfDurations: new Map(commitDataBackend.fiberSelfDurations),
        passiveEffectDuration: commitDataBackend.passiveEffectDuration,
        priorityLevel: commitDataBackend.priorityLevel,
        timestamp: commitDataBackend.timestamp,
        updaters:
          commitDataBackend.updaters !== null
            ? commitDataBackend.updaters.map((serializedElement) => {
                const [serializedElementDisplayName, serializedElementHocDisplayNames] = separateDisplayNameAndHOCs(
                  serializedElement.displayName,
                  serializedElement.type,
                )
                return {
                  ...serializedElement,
                  displayName: serializedElementDisplayName,
                  hocDisplayNames: serializedElementHocDisplayNames,
                }
              })
            : null,
      }))

      dataForRoots.set(rootID, {
        commitData: convertedCommitData,
        displayName,
        initialTreeBaseDurations: new Map(initialTreeBaseDurations),
        operations,
        rootID,
        snapshots: new Map(),
      })
    })
  })

  return { dataForRoots, imported: false, timelineData: timelineDataArray }
}

function separateDisplayNameAndHOCs(
  displayName: string | null,
  type: ElementType,
): [string | null, Array<string> | null] {
  if (displayName === null) {
    return [null, null]
  }

  let hocDisplayNames = null

  switch (type) {
    case 1:
    case 6:
    case 5:
    case 8:
      if (displayName.indexOf('(') >= 0) {
        const matches = displayName.match(/[^()]+/g)
        if (matches != null) {
          displayName = matches.pop() || null
          hocDisplayNames = matches
        }
      }
      break
    default:
      break
  }

  return [displayName, hocDisplayNames]
}
