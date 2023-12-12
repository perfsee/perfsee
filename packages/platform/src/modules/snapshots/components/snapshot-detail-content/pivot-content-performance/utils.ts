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

import { AuditsSchema } from '@perfsee/shared'

import { LighthouseAudit, LighthouseGroupType } from '../../../snapshot-type'

export const getGroupedAuditLists = (
  audits: AuditsSchema,
  auditRefs?: LH.Result.AuditRef[],
  hideRelevant?: boolean,
) => {
  const result: Record<LighthouseGroupType, LighthouseAudit[]> = {
    [LighthouseGroupType.opportunity]: [], //  0 <= score < 0.9
    [LighthouseGroupType.diagnostic]: [],
    [LighthouseGroupType.manual]: [],
    [LighthouseGroupType.passed]: [], // score >= 0.9
    [LighthouseGroupType.notApply]: [],
  }

  const relevantAuditMap = new Map<string, string[]>()
  const auditRelevantMap = new Map<string, string[]>()

  if (!auditRefs || !auditRefs.length) {
    return { result, relevantAuditMap }
  }

  auditRefs.forEach((ref) => {
    if (!ref.relevantAudits || hideRelevant) return

    ref.relevantAudits.forEach((id) => {
      const arr = auditRelevantMap.get(id) ?? []
      ref.acronym && arr.push(ref.acronym)
      auditRelevantMap.set(id, arr)
      arr.forEach((r) => {
        if (!relevantAuditMap.has(r)) {
          relevantAuditMap.set(r, [])
        }

        relevantAuditMap.get(r)!.push(id)
      })
    })
  })

  auditRefs.forEach((ref) => {
    const item = audits[ref.id] as LighthouseAudit
    if (!hideRelevant) {
      item.relevant = auditRelevantMap.get(ref.id)
    }

    if (typeof item.score !== 'number') {
      if (item.scoreDisplayMode === 'notApplicable') {
        result[LighthouseGroupType.notApply].push(item)
      }
      if (item.scoreDisplayMode === 'manual') {
        result[LighthouseGroupType.manual].push(item)
      }
      if (item.scoreDisplayMode === 'informative' && (item.displayValue || item.metricSavings || item.explanation)) {
        result[LighthouseGroupType.diagnostic].push(item)
      }
    } else if (item.score >= 0.9) {
      result[LighthouseGroupType.passed].push(item)
    } else if (item.score < 0.9 && item.details) {
      result[LighthouseGroupType.opportunity].push(item)
    }
  })

  return { result, relevantAuditMap }
}
