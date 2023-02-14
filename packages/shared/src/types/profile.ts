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

export type MapMapToRecord<T> = {
  [key in keyof T]: T[key] extends Map<infer K, infer V> | null
    ? K extends string | number | symbol
      ? Record<K, MapMapToRecord<V>>
      : never
    : T[key] extends Array<infer E>
    ? Array<MapMapToRecord<E>>
    : T[key]
}

export type ReactProfileData = MapMapToRecord<ProfilingDataFrontend>
export type ProfilingDataForRoot = MapMapToRecord<ProfilingDataForRootFrontend>
export type ReactTimelineData = MapMapToRecord<TimelineData>

export type { ReactComponentMeasure, SuspenseEvent, CommitDataFrontend } from 'react-devtools-inline'
