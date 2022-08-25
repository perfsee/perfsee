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

import { execSync } from 'child_process'

import config from 'config'

import { Command } from './command'

const requirements = [
  { service: 'redis', cli: 'redis-cli' },
  { service: 'mysql', cli: 'mysql' },
]

export class InitCommand extends Command {
  static paths = [['init-env']]

  async execute() {
    await this.ensureRequirements()
    this.createDatabase()
    await this.migrate()
  }

  private async ensureRequirements() {
    const brewPath = execSync('which brew').toString()
    if (!brewPath) {
      console.error('Please install homebrew first. see: https://brew.sh/')
      return
    }

    await Promise.all(
      requirements.map(async ({ cli, service }) => {
        this.logger.info(`detect ${service}`)
        const path = this.exec(`which ${cli}`)
        if (!path) {
          this.logger.info(`service ${service} not found, installing...`)
          await this.execAsync(`brew install ${service}`)
        }
      }),
    )
  }

  private createDatabase() {
    execSync(`mysql -u ${config.mysql.username} -e "CREATE DATABASE IF NOT EXISTS ${config.mysql.database};"`, {
      stdio: 'inherit',
    })
  }

  private async migrate() {
    await this.execAsync('yarn typeorm:migrate')
  }
}
