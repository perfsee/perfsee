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

import { Audit, Logger } from '../../types'
import { runInVm } from '../vm'

import { compressionNotice } from './compression-notice'
import { duplicateLibs } from './duplicate-libs'
import { http2Notice } from './http2-notice'
import { largeAssets } from './large-assets'
import { largeLibs } from './large-libs'
import { missingSourceMap } from './missing-sourcemap'
import { mixedJs } from './mixed-js'
import { avoidNonEsmContent } from './non-esm-content'
import { nonMinifiedAssets } from './non-minified-assets'
import { avoidSideEffects } from './non-side-effects'
import { outRepoLibs } from './out-repo-libs'
import { preconnect } from './pre-connect'
import { unhealthyLibs } from './unhealthy-libs'

const allAudits = {
  'compression-notice': compressionNotice,
  'duplicate-libraries': duplicateLibs,
  'http2-notice': http2Notice,
  'large-assets': largeAssets,
  'large-libraries': largeLibs,
  'mix-content-assets': mixedJs,
  'non-minified-assets': nonMinifiedAssets,
  'uncontrolled-libraries': outRepoLibs,
  'pre-connect-origin': preconnect,
  'unhealthy-libraries': unhealthyLibs,
  'missing-sourcemap': missingSourceMap,
  'avoid-non-esm': avoidNonEsmContent,
  'avoid-side-effects': avoidSideEffects,
}

export const webAudits: Audit[] = [
  compressionNotice,
  duplicateLibs,
  http2Notice,
  largeAssets,
  largeLibs,
  mixedJs,
  nonMinifiedAssets,
  outRepoLibs,
  preconnect,
  unhealthyLibs,
  missingSourceMap,
  avoidNonEsmContent,
  avoidSideEffects,
]

const ruleSet = {
  default: webAudits,
}

export const getAudits = async (
  logger: Logger,
  assetsPath: string,
  rules?: string[],
  auditFetcher?: (rule: string) => Promise<string | Audit | undefined>,
): Promise<Audit[]> => {
  if (!rules) {
    return ruleSet.default
  }
  const audits = await Promise.all(
    [...new Set(rules)].map(async (rule) => {
      const localAudits = ruleSet[rule] || [allAudits[rule]].filter(Boolean)
      if (localAudits?.length) {
        return localAudits
      }

      let scriptOrFn: string | Audit | undefined
      try {
        logger.info(`Trying to fetch audit for ${rule}`)
        scriptOrFn = await auditFetcher?.(rule)
      } catch (e) {
        logger.error(`Fetching audit for ${rule} failed.`, { error: e })
      }
      if (typeof scriptOrFn === 'string') {
        const audit: Audit = async (params) => {
          try {
            const result = await runInVm(rule, scriptOrFn as string, assetsPath, params, logger)
            if (!validateAuditResult(result)) {
              logger.error(`Audit ${rule} result invalid`)
              return null
            }
            return result
          } catch (e) {
            logger.error('Failed to run scripts in VM.', { error: e })
            return null
          }
        }

        return [audit]
      } else if (typeof scriptOrFn === 'function') {
        return [scriptOrFn]
      }

      return []
    }),
  )

  return [...new Set(audits)].flat().filter((a) => typeof a === 'function')
}

export const validateAuditResult = (result: any) => {
  return typeof result?.id === 'string' && typeof result?.title === 'string' && typeof result?.weight === 'number'
}

export * from './cache-invalidation'

export type AuditID = keyof typeof allAudits | keyof typeof ruleSet
