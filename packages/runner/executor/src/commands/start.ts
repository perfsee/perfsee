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

import { Command } from 'clipanion'

import { logger } from '@perfsee/job-runner-shared'

import { ConfigManager, printValidationErrors } from '../config'
import { Runner } from '../runner'

export class StartCommand extends Command {
  static paths = [['start']]

  async execute() {
    const configManager = new ConfigManager()
    configManager.load()

    const validationResult = configManager.validate()
    if (!validationResult.ok) {
      printValidationErrors(validationResult.errors)
      return 1
    }

    this.start(configManager)
    logger.info('Runner started')
    return Promise.resolve()
  }

  private start(configManager: ConfigManager) {
    const runner = new Runner(configManager)
    runner.start()
  }
}
