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

import { Option } from 'clipanion'
import fetch from 'node-fetch'

import { validateAuditResult, runInVm } from '@perfsee/bundle-analyzer'

import { Package, packagePath } from '../utils'

import { Command } from './command'

export class UploadExtensionsCommand extends Command {
  static paths = [['upload-extensions']]

  host: string = Option.String('-h, --host', process.env.PERFSEE_HOST ?? 'https://perfsee.com')
  token: string = Option.String('-t, --token', process.env.PERFSEE_REGISTRATION_TOKEN ?? '')

  async execute() {
    if (!this.token) {
      this.logger.error('No registration token provided')
      return 1
    }

    let error = false

    const pkg: Package = require(packagePath(
      '@perfsee/bundle-analyzer',
      'src',
      'stats-parser',
      'audit',
      '__extensions__',
      'package.json',
    ))

    // bundle
    await this.execAsync('NODE_ENV=production yarn cli bundle -p @perfsee/bundle-analyzer')
    const bundleAuditPath = packagePath('@perfsee/bundle-analyzer', 'tmp', 'audit')

    // test
    const source = readFileSync(require.resolve(bundleAuditPath), 'utf-8')
    try {
      console.info('Start testing scripts.')
      const result = await runInVm(
        pkg.name,
        source,
        '',
        { assets: [], packages: [], chunks: [], size: { raw: 0, gzip: 0, brotli: 0 }, stats: {} },
        console as any,
      )
      if (validateAuditResult(result)) {
        console.info('Testing success. Audit result:', result)
      } else {
        console.error('Invalid audit result.')
        return 1
      }
    } catch (e) {
      console.error('Audit testing failed', String(e))
      throw e
    }

    // compress
    const tarPath = bundleAuditPath + '.tgz'
    await this.execAsync(['tar', '-czf', tarPath, '-C', bundleAuditPath, '.'])
    let checksum = this.exec(`shasum ${tarPath} --algorithm 256 | cut -d' ' -f1`, { silent: true })
    checksum = Buffer.from(checksum, 'hex').toString('base64')
    this.logger.info(`${tarPath} checksum is: ${checksum}`)

    // upload
    const type = `extension.bundleAudit.${pkg.name}`
    const params = {
      enable: true,
      // @ts-expect-error
      desc: pkg.description,
    }
    const query = Object.keys(params)
      .map((key) => {
        return `${key}=${params[key] ? encodeURIComponent(params[key]) : ''}`
      })
      .join('&')
    const res = await fetch(`${this.host}/api/runners/scripts/${type}/${pkg.version}?${query}`, {
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

    return error ? 1 : 0
  }
}
