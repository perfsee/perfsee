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

import { useMemo } from 'react'

import { buildProfileFromTracehouse, FlamechartContainer, lightTheme, Timing } from '@perfsee/flamechart'
import { Color } from '@perfsee/flamechart/lib/color'
import { triangle } from '@perfsee/flamechart/lib/utils'
import { formatMsDuration } from '@perfsee/platform/common'
import { TraceTimesWithoutFCP } from '@perfsee/shared'
import { Task } from '@perfsee/tracehouse'

import { getRecordTypeParams, getSortedTimingType } from './helper'
import {
  TimelineContainer,
  TimelineFlamechartContainer,
  TimelineLegendTable,
  TimelineLegendTableHeading,
  TimelineLegendTableRow,
} from './style'

/**
 * custom flamechart theme,
 * We generate an HCL color for each frame, and the C_0 C_d L_0 L_d here are used to control the range of each channel of the HCL.
 **/
const C_0 = 0
const C_d = 0.8
const L_0 = 0.55
const L_d = 0.1
const flamechartThemeColorForBucket = (t: number) => {
  const x = triangle(30.0 * t)
  const H = 360.0 * (t * 33.0)
  const C = C_0 + C_d * x
  const L = L_0 - L_d * x
  return Color.fromLumaChromaHue(L, C, H)
}
const flamechartThemeColorForBucketGLSL = `
  vec3 colorForBucket(float t) {
    float x = triangle(30.0 * t);
    float H = 360.0 * (t * 33.0);
    float C = ${C_0.toFixed(2)} + ${C_d.toFixed(2)} * x;
    float L = ${L_0.toFixed(2)} - ${L_d.toFixed(2)} * x;
    return hcl2rgb(H, C, L);
  }
`
const flamechartTheme = {
  ...lightTheme,
  // Use a transparent background because we use css background to draw the horizontal axis.
  bgPrimaryColor: '#ffffff00',
  colorForBucket: flamechartThemeColorForBucket,
  colorForBucketGLSL: flamechartThemeColorForBucketGLSL,
}

interface Props {
  tasks: Task[]
  timings: TraceTimesWithoutFCP
}

function taskLayer(taskKind: string) {
  switch (taskKind) {
    case 'scriptEvaluation':
      return {
        level: 1,
        groupName: 'Scripting',
      }
    case 'scriptParseCompile':
      return {
        level: 2,
        groupName: 'scriptParseCompile',
      }
    case 'styleLayout':
      return {
        level: 3,
        groupName: 'Style & Layout',
      }
    case 'garbageCollection':
      return {
        level: 4,
        groupName: 'Garbage Collection',
      }
    case 'paintCompositeRender':
      return {
        level: 5,
        groupName: 'Rendering',
      }
    default:
      return {
        level: 0,
        groupName: 'Task',
      }
  }
}

export const ExecutionTimeline: React.FunctionComponent<Props> = ({ tasks, timings: traceTimes }) => {
  const tasksProfile = useMemo(() => {
    const profile = tasks && buildProfileFromTracehouse(tasks, 0)
    profile.groupBy(taskLayer)
    return profile
  }, [tasks])

  const taskDurations = useMemo(() => {
    const durations = {
      task: 0,
      scriptEvaluation: 0,
      scriptParseCompile: 0,
      styleLayout: 0,
      garbageCollection: 0,
      paintCompositeRender: 0,
    }
    tasksProfile.forEachFrame((frame) => {
      const ms = frame.getTotalWeight() / 1000
      switch (frame.name) {
        case 'Scripting':
          durations.scriptEvaluation = ms
          break
        case 'scriptParseCompile':
          durations.scriptParseCompile = ms
          break
        case 'Style & Layout':
          durations.styleLayout = ms
          break
        case 'Garbage Collection':
          durations.garbageCollection = ms
          break
        case 'Rendering':
          durations.paintCompositeRender = ms
          break
        case 'Task':
          durations.task = ms
          break
      }
    })
    return durations
  }, [tasksProfile])

  const timings = useMemo<Timing[] | undefined>(() => {
    return getSortedTimingType(traceTimes).map((type) => {
      const time = traceTimes[type] as number
      const params = getRecordTypeParams(type)
      return {
        name: params.text,
        value: time * 1000,
        color: params.color,
      }
    })
  }, [traceTimes])

  return (
    <TimelineContainer>
      <TimelineLegendTable>
        <TimelineLegendTableHeading>
          <span>Type</span>
          <span>Duration</span>
        </TimelineLegendTableHeading>
        <TimelineLegendTableRow>
          <span>Task</span>
          <span>{formatMsDuration(taskDurations.task, true, 2)}</span>
        </TimelineLegendTableRow>
        <TimelineLegendTableRow>
          <span>Scripting</span>
          <span>{formatMsDuration(taskDurations.scriptEvaluation, true, 2)}</span>
        </TimelineLegendTableRow>
        <TimelineLegendTableRow>
          <span>scriptParseCompile</span>
          <span>{formatMsDuration(taskDurations.scriptParseCompile, true, 2)}</span>
        </TimelineLegendTableRow>
        <TimelineLegendTableRow>
          <span>Style & Layout</span>
          <span>{formatMsDuration(taskDurations.styleLayout, true, 2)}</span>
        </TimelineLegendTableRow>
        <TimelineLegendTableRow>
          <span>Garbage Collection</span>
          <span>{formatMsDuration(taskDurations.garbageCollection, true, 2)}</span>
        </TimelineLegendTableRow>
        <TimelineLegendTableRow>
          <span>Rendering</span>
          <span>{formatMsDuration(taskDurations.paintCompositeRender, true, 2)}</span>
        </TimelineLegendTableRow>
      </TimelineLegendTable>
      <TimelineFlamechartContainer>
        <FlamechartContainer
          bottomTimingLabels
          profile={tasksProfile}
          flamechartFactory={'tracehouse-grouped'}
          disableDetailView
          timings={timings}
          bottomPadding={1.25}
          theme={flamechartTheme}
          disableSearchBox
        />
      </TimelineFlamechartContainer>
    </TimelineContainer>
  )
}
