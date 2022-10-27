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

import { isNumber } from 'lodash'

import { SharedColors, NeutralColors, darken, lighten } from '@perfsee/dls'
import { TimingType, TraceTimesWithoutFCP } from '@perfsee/shared'
import { Task } from '@perfsee/tracehouse'

import { RecordType } from '../../snapshot-type'

export const getRecordTypeParams = (type: RecordType | TimingType | string) => {
  switch (type) {
    case RecordType.scriptEvaluation:
      return {
        color: SharedColors.yellow10,
        text: 'Scripting',
      }
    case RecordType.other:
      return {
        color: SharedColors.gray10,
        text: 'Task',
      }
    case RecordType.longTask:
      return {
        color: SharedColors.red10,
        text: 'Blocking task warning',
      }
    case RecordType.parseHTML:
      return {
        color: SharedColors.blueMagenta10,
        text: 'Parse HTML',
      }
    case RecordType.styleLayout:
      return {
        color: SharedColors.magenta20,
        text: 'Style & Layout',
      }
    case RecordType.paintCompositeRender:
      return {
        color: SharedColors.green10,
        text: 'Rendering',
      }
    case TimingType.FP:
      return {
        color: lighten(SharedColors.green10, 0.5),
        text: 'FP',
      }
    case TimingType.FCP:
      return {
        color: lighten(SharedColors.green10, 0.3),
        text: 'FCP',
      }
    case TimingType.FMP:
      return {
        color: darken(SharedColors.green10, 0.1),
        text: 'FMP',
      }
    case TimingType.LCP:
      return {
        color: darken(SharedColors.green10, 0.4),
        text: 'LCP',
      }
    case TimingType.DCL:
      return {
        color: SharedColors.blue10,
        text: 'DCL',
      }
    case TimingType.LOAD:
      return {
        color: SharedColors.red10,
        text: 'LOAD',
      }
    default:
      return {
        color: NeutralColors.black,
      }
  }
}

export const getSortedTimingType = (timings?: TraceTimesWithoutFCP) => {
  return timings
    ? Object.values(TimingType)
        .filter((type) => isNumber(timings[type]))
        .sort((a, b) => timings[a]! - timings[b]!)
    : []
}

export const getChartEndTime = (tasks?: Task[], timings?: TraceTimesWithoutFCP) => {
  let taskEndTime = 0
  let timingEndTime = 0
  if (tasks?.length) {
    taskEndTime = tasks[tasks.length - 1].endTime
  }
  if (timings) {
    const sortTimingTypes = getSortedTimingType(timings)
    const lastTimingType = sortTimingTypes[sortTimingTypes.length - 1]
    timingEndTime = timings[lastTimingType]!
  }

  return Math.max(taskEndTime, timingEndTime)
}
