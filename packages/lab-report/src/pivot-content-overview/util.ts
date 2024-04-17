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

import { AuditsSchema, LighthouseScoreType } from '@perfsee/shared'

import { LighthouseAudit } from '../snapshot-type'

export const getCategoryCount = (audits: AuditsSchema, auditRefs: LH.Result.AuditRef[]) => {
  let passed = 0
  let notApply = 0
  let opportunity = 0

  auditRefs.forEach((ref) => {
    const item = audits[ref.id] as LighthouseAudit

    if (typeof item.score !== 'number') {
      if (item.scoreDisplayMode === 'notApplicable') {
        notApply++
      }
    } else if (item.score >= 0.9) {
      passed++
    } else if (item.score < 0.9 && item.details) {
      opportunity++
    }
  })

  return { passed, notApply, opportunity }
}

// Only those metrics contribute to Lighthouse Performance score. (lighthouse v7)
/**
 * @deprecated
 */
const LHCalculator = [
  LighthouseScoreType.FCP,
  LighthouseScoreType.LCP,
  LighthouseScoreType.SI,
  LighthouseScoreType.TTI,
  LighthouseScoreType.TBT,
  LighthouseScoreType.CLS,
]

export const isLHCalculator = (id: LighthouseScoreType, categories?: LH.Result.Category) => {
  // INP is core web vitals, but does not contribute to performance score
  if (id === LighthouseScoreType.INP) {
    return true
  }

  if (categories) {
    return !!categories.auditRefs.find((ref) => ref.id === id)?.weight
  }

  return LHCalculator.includes(id)
}

export const getCategoryAcorms = (lhCategories: Record<string, LH.Result.Category> = {}) => {
  const idToAcorms: Record<string, string> = {}

  Object.values(lhCategories).forEach((category) => {
    category.auditRefs.forEach((ref) => {
      if (ref.acronym && ref.relevantAudits?.length) {
        idToAcorms[ref.id] = ref.acronym
      }
    })
  })

  return idToAcorms
}
