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

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'fs'
import { homedir, hostname } from 'os'
import { join, parse } from 'path'

import { isNil, merge, omitBy } from 'lodash'

import { PartialRunnerConfig, RunnerConfig, logger } from '@perfsee/job-runner-shared'
import { JobType } from '@perfsee/server-common'

import { version } from '../version'

import { validateConfig, ValidationResult } from './validation'

const CONFIG_FILE_PATH = join(
  process.env.NODE_ENV === 'development' ? __dirname : homedir(),
  '.config/perfsee/runner.json',
)

export class ConfigManager {
  mtime: Date | null = null
  loaded = false
  private config: RunnerConfig | null = null

  constructor(public readonly configFile = CONFIG_FILE_PATH) {}

  load(): Readonly<RunnerConfig> {
    if (this.config) {
      return this.config
    }

    this.config = this.default()

    if (existsSync(this.configFile)) {
      merge(this.config, JSON.parse(readFileSync(this.configFile, 'utf8')))
      this.loaded = true
      this.mtime = statSync(this.configFile).mtime
    }

    return this.config!
  }

  save() {
    try {
      const parsedPath = parse(this.configFile)
      mkdirSync(parsedPath.dir, { recursive: true })
      writeFileSync(this.configFile, JSON.stringify(this.config, null, 2), 'utf8')
    } catch (e) {
      logger.error('Failed to sync runner config to disk', e)
    }
  }

  patch(patch: PartialRunnerConfig, save = true) {
    if (!this.config) {
      throw new Error('config should be loaded before patching')
    }

    merge(this.config, omitBy(patch, isNil))

    if (save) {
      this.save()
    }
  }

  validate(): ValidationResult {
    if (this.config) {
      return validateConfig(this.config)
    }

    return {
      ok: false,
      errors: [
        {
          field: '',
          reason: 'no runner config found!',
        },
      ],
    }
  }

  private default(): RunnerConfig {
    return {
      version,
      name: hostname(),
      // @ts-expect-error
      server: {
        // in seconds
        timeout: 180,
      },
      runner: {
        // in seconds
        jobType: JobType.All,
        checkInterval: 5,
        timeout: 600,
        concurrency: 1,
      },
    }
  }
}
