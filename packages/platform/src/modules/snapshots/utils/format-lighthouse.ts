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

import { PerformanceTabType } from '@perfsee/lab-report/snapshot-type'

export const OverviewTab = {
  id: PerformanceTabType.Overview,
  title: 'Overview',
}

export const RequestsTab = {
  id: PerformanceTabType.Requests,
  title: 'Requests',
}

export const ReportTab = {
  id: PerformanceTabType.Report,
  title: 'Analysis Report',
}

export const FlamechartTab = {
  id: PerformanceTabType.Flamechart,
  title: 'Flame Chart',
}

export const SourceCoverageTab = {
  id: PerformanceTabType.SourceCoverage,
  title: 'Coverage',
}

export const LogTab = {
  id: PerformanceTabType.Log,
  title: 'Log',
}

export const ReactTab = {
  id: PerformanceTabType.React,
  title: 'React',
}

export const SourceStatisticsTab = {
  id: PerformanceTabType.SourceStatistics,
  title: 'Source',
}
