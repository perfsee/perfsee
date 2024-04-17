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

import { SnapshotDetailType, SnapshotReportSchema } from '@perfsee/lab-report/snapshot-type'
import { LHStoredSchema } from '@perfsee/shared'

export const formatStorageResultToSnapshotDetail = (
  payload: LHStoredSchema,
  report: SnapshotReportSchema,
): Omit<SnapshotDetailType, 'report'> => {
  return {
    lighthouseVersion: payload.lighthouseVersion,
    audits: payload.lhrAudit,
    categories: payload.lhrCategories,
    traceData: payload.traceData,
    timings: payload.timings,
    timelines: payload.timelines,
    metricScores: payload.metricScores,
    requests: payload.artifactsResult,
    requestsBaseTimestamp: payload.artifactsResultBaseTimestamp,
    userTimings: payload.userTimings,
    entities: payload.entities,
    fullPageScreenshot: payload.fullPageScreenshot,
    stackPacks: payload.stackPacks,
    userFlow: payload.userFlow
      ?.map((uf) => ({
        stepName: uf.stepName,
        stepId: uf.stepId,
        timelines: uf.timelines,
        metricScores: uf.metricScores,
        reportId: report.userFlow?.find((u) => u.stepId === uf.stepId)?.id as number,
      }))
      .filter((uf) => uf.reportId),
  }
}
