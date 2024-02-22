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

import { BundleAuditResult, AuditParam, Logger, EntryPoint, Audit } from '../types'

import { getAudits } from './rules'

export * from './rules'
export { runInVm } from './vm'

export const audit: (
  param: Readonly<AuditParam>,
  logger: Logger,
  rules?: string[],
  audits?: Audit[],
  auditFetcher?: (rule: string) => Promise<string | Audit | undefined>,
) => Promise<BundleAuditResult[]> = async (param, logger, rules, audits, auditFetcher) => {
  logger.info('Start auditing bundle.')
  const auditResult = []
  const funcs = (await getAudits(logger, param.assetsPath, rules, auditFetcher)).concat(audits || [])

  for (const func of funcs) {
    let ruleResult = func(param)
    if (ruleResult instanceof Promise) {
      ruleResult = await ruleResult
    }
    if (!Array.isArray(ruleResult)) {
      ruleResult = [ruleResult]
    }

    ruleResult.forEach((rule) => {
      logger.verbose(`[weight=${rule.weight},score=${rule.numericScore?.value ?? 1}] Audit: ${rule.title}`)
    })
    auditResult.push(ruleResult)
  }
  logger.info('Bundle auditing finished.')
  return auditResult.flat()
}

export function calcBundleScore(entries: EntryPoint[]) {
  let totalScore = 0

  let calculatedEntryLen = 0
  for (const entry of entries) {
    if (typeof entry.score === 'number') {
      totalScore += entry.score
      calculatedEntryLen += 1
    } else {
      totalScore += calcEntryPointScore(entry.audits)
      calculatedEntryLen += 1
    }
  }

  return Math.min(100, Math.round(totalScore / calculatedEntryLen))
}

export function calcEntryPointScore(audits: BundleAuditResult[]) {
  let weight = 0
  let score = 0

  for (const audit of audits) {
    if (audit.numericScore && audit.weight) {
      score += audit.numericScore.value * audit.weight
      weight += audit.weight
    }
  }

  if (weight === 0) {
    return 0
  }

  return Math.round((score / weight) * 100)
}
