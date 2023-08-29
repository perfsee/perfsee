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

import { CallFrame } from '@perfsee/flamechart'

/** The type of the Profile & ProfileChunk event in Chromium traces. Note that this is subtly different from Crdp.Profiler.Profile. */
export interface TraceCpuProfile {
  nodes?: Array<{ id: number; callFrame: { functionName: string; url?: string }; parent?: number }>
  samples?: Array<number>
  timeDeltas?: Array<number>
}

export interface FunctionStackTrace extends CallFrame {
  codeType: string
}

/**
 * @see https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview
 */
export interface TraceEvent {
  name: string
  cat: string
  args: {
    fileName?: string
    snapshot?: string
    sync_id?: string
    beginData?: {
      frame?: string
      startLine?: number
      url?: string
    }
    data?: {
      frame?: string
      isLoadingMainFrame?: boolean
      documentLoaderURL?: string
      frames?: {
        frame: string
        url: string
        parent?: string
        processId?: number
      }[]
      page?: string
      readyState?: number
      requestId?: string
      startTime?: number
      timeDeltas?: TraceCpuProfile['timeDeltas']
      cpuProfile?: TraceCpuProfile
      callFrame?: Required<TraceCpuProfile>['nodes'][0]['callFrame']
      /** Marker for each synthetic CPU profiler event for the range of _potential_ ts values. */
      _syntheticProfilerRange?: {
        earliestPossibleTimestamp: number
        latestPossibleTimestamp: number
      }
      stackTrace?: {
        url: string
      }[]
      styleSheetUrl?: string
      timerId?: string
      url?: string
      is_main_frame?: boolean
      cumulative_score?: number
      id?: string
      nodeId?: number
      impacted_nodes?: Array<{
        node_id: number
        old_rect?: Array<number>
        new_rect?: Array<number>
      }>
      score?: number
      weighted_score_delta?: number
      had_recent_input?: boolean
      compositeFailed?: number
      unsupportedProperties?: string[]
      size?: number
      /** Responsiveness data. */
      interactionType?: 'drag' | 'keyboard' | 'tapOrClick'
      maxDuration?: number
      type?: string
    }
    frame?: string
    name?: string
    labels?: string
  }
  hotFunctionsStackTraces?: FunctionStackTrace[][]
  pid: number
  tid: number
  /** Timestamp of the event in microseconds. */
  ts: number
  dur: number
  ph: 'B' | 'b' | 'D' | 'E' | 'e' | 'F' | 'I' | 'M' | 'N' | 'n' | 'O' | 'R' | 'S' | 'T' | 'X'
  s?: 't'
  id?: string
  id2?: {
    local?: string
  }
}
