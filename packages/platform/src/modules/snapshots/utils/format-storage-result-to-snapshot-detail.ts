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

import { LHStoredSchema } from '@perfsee/shared'

import { SnapshotDetailType } from '../snapshot-type'

export const formatStorageResultToSnapshotDetail = (payload: LHStoredSchema): Omit<SnapshotDetailType, 'report'> => {
  return {
    lighthouseVersion: payload.lighthouseVersion,
    audits: payload.lhrAudit,
    categories: payload.lhrCategories,
    traceData: payload.traceData,
    timelines: payload.timelines,
    metricScores: payload.metricScores,
    requests: payload.artifactsResult,
    requestsBaseTimestamp: payload.artifactsResultBaseTimestamp,
    userTimings: payload.userTimings,
    userFlow: payload.userFlow?.map((uf) => ({
      stepName: uf.stepName,
      stepUrl: uf.stepUrl,
      stepMode: uf.stepMode,
      requests: [],
      audits: uf.lhrAudit,
      categories: uf.lhrCategories,
      timings: uf.timings,
      timelines: uf.timelines,
      metricScores: uf.metricScores,
    })),
  }
}
