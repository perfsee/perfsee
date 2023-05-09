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

import { readFileSync } from 'fs'
import { join } from 'path'

import { Option } from 'clipanion'
import fetch from 'node-fetch'

import { getPackage, PackageName } from '../utils'

import { Command } from './command'

const scripts: { [key in PackageName]?: string[] } = {
  '@perfsee/job-runner-bundle': ['job.BundleAnalyze'],
  '@perfsee/job-runner-lab': ['job.LabAnalyze', 'job.E2EAnalyze', 'job.LabPing'],
  '@perfsee/job-runner-source': ['job.SourceAnalyze'],
  '@perfsee/job-runner-package': ['job.PackageAnalyze'],
}
export class UploadScriptsCommand extends Command {
  static paths = [['upload-scripts']]

  host: string = Option.String('-h, --host', process.env.PERFSEE_HOST ?? 'https://perfsee.com')
  token: string = Option.String('-t, --token', process.env.PERFSEE_REGISTRATION_TOKEN ?? '')

  async execute() {
    if (!this.token) {
      this.logger.error('No registration token provided')
      return 1
    }

    let error = false

    await Promise.allSettled(
      Object.entries(scripts).map(async ([name, types]) => {
        const pkg = getPackage(name as PackageName)
        const outputPath = './tmp'

        // extract
        await this.execAsync(`yarn cli extract -p ${pkg.name} -o ${outputPath}`)

        const tarPath = join(outputPath, `${pkg.dirname}.tgz`)
        let checksum = this.exec(`shasum ./tmp/${pkg.dirname}.tgz --algorithm 256 | cut -d' ' -f1`, { silent: true })
        checksum = Buffer.from(checksum, 'hex').toString('base64')
        this.logger.info(`${tarPath} checksum is: ${checksum}`)

        // upload
        for (const type of types) {
          const res = await fetch(`${this.host}/api/runners/scripts/${type}/${pkg.version}`, {
            method: 'POST',
            body: readFileSync(tarPath),
            headers: {
              'content-type': 'application/octet-stream',
              'x-registration-token': this.token,
              'x-checksum': checksum,
            },
          })

          if (res.ok) {
            this.logger.info(`upload ${type}/${pkg.version} success`)
          } else {
            this.logger.error(`upload ${type}/${pkg.version} failed`, JSON.stringify(await res.json()))
            error = true
          }
        }
      }),
    )

    return error ? 1 : 0
  }
}
