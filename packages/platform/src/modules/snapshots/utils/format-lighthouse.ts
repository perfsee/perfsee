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

import { PerformanceTabType } from '../snapshot-type'

export const OverviewTab = {
  id: PerformanceTabType.Overview,
  title: 'Overview',
}

export const UserFlowTab = {
  id: PerformanceTabType.UserFlow,
  title: 'User Flow',
}

export const BreakdownTab = {
  id: PerformanceTabType.Breakdown,
  title: 'Breakdown',
}

export const AssetTab = {
  id: PerformanceTabType.Asset,
  title: 'Asset',
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
  title: 'Treemap',
}

export const ReactTab = {
  id: PerformanceTabType.React,
  title: 'React',
}
