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

import { get } from 'lodash'

import { RunnerConfig, logger } from '@perfsee/job-runner-shared'

import { SIMPLE_URL_REGEXP } from '../constants'

interface ValidationError {
  field: string
  reason: string
}
export type ValidationResult =
  | {
      ok: true
    }
  | {
      ok: false
      errors: ValidationError[]
    }

type Join<K, P> = K extends string | number
  ? P extends string | number
    ? K extends ''
      ? P
      : `${K}.${P}`
    : never
  : never
type Paths<T, Path extends string = ''> = T extends Record<string | number, any>
  ? {
      [K in keyof T]-?: K extends string | number ? `${K}` | Join<K, Paths<T[K], Path>> : never
    }[keyof T]
  : never

type ValidatorOptions = {
  field: Paths<RunnerConfig>
  rules: Array<(field: string, value: unknown) => ValidationError | null | undefined>
}

function existsValidationRule(field: string, value: unknown) {
  if (!value) {
    return {
      field,
      reason: `expect field {${field}} to exist`,
    }
  }
}

function numberValidationRule(field: string, value: unknown) {
  if (typeof value !== 'number') {
    return {
      field,
      reason: `expect field {${field}} to be numeric`,
    }
  }
}

function urlValidationRule(field: string, value: unknown) {
  if (typeof value !== 'string' || !SIMPLE_URL_REGEXP.test(value)) {
    return {
      field,
      reason: `expect field {${field}} to be a valid url.`,
    }
  }
}

const configRules: ValidatorOptions[] = [
  {
    field: 'server',
    rules: [existsValidationRule],
  },
  {
    field: 'server.token',
    rules: [existsValidationRule],
  },
  {
    field: 'server.url',
    rules: [existsValidationRule, urlValidationRule],
  },
  {
    field: 'server.timeout',
    rules: [numberValidationRule],
  },
  {
    field: 'runner.checkInterval',
    rules: [numberValidationRule],
  },
  {
    field: 'runner.timeout',
    rules: [numberValidationRule],
  },
  {
    field: 'runner.concurrency',
    rules: [numberValidationRule],
  },
]

export function validateConfig(config: RunnerConfig): ValidationResult {
  const errors: ValidationError[] = []
  configRules.forEach(({ field, rules }) => {
    rules.forEach((validator) => {
      const error = validator(field, get(config, field))
      if (error) {
        errors.push(error)
      }
    })
  })

  if (errors.length) {
    return {
      ok: false,
      errors,
    }
  }

  return {
    ok: true,
  }
}

export function printValidationErrors(errors: ValidationError[]) {
  logger.error('found invalid runner config: ')
  logger.error(errors.map((error) => error.reason).join('\n'))
}
