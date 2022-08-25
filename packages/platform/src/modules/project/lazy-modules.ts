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

import { lazy } from '../../common'

export const ProjectHome = lazy(() => import(/* webpackChunkName: "project" */ './statistics'))
export const BundleRoutes = lazy(() => import(/* webpackChunkName: "bundle-page" */ '../bundle'))
export const LabRoutes = lazy(() => import(/* webpackChunkName: "lab-page" */ '../lab'))
export const CompetitorRoutes = lazy(() => import(/* webpackChunkName: "competitor-page" */ '../competitor'))
export const SourcePage = lazy(() => import(/* webpackChunkName: "source-page" */ '../source'))
export const VersionReport = lazy(() => import(/* webpackChunkName: 'project-version-report' */ '../version-report'))
export const ArtifactStatistics = lazy(
  () => import(/* webpackChunkName: "statistics-artifact" */ './statistics/charts/artifact-size'),
)
export const SnapshotStatistics = lazy(
  () => import(/* webpackChunkName: "statistics-snapshot" */ './statistics/charts/snapshot-metrics'),
)
export const SettingsPage = lazy(() => import(/* webpackChunkName: "project-settings" */ './settings'))
export const JobTrace = lazy(() => import(/* webpackChunkName: "job-trace" */ '../job-trace'))
