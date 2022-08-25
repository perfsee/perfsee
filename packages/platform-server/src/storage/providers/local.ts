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

import { promises as fs, createReadStream } from 'fs'
import { join, parse } from 'path'

import debugFactory from 'debug'

import { PrettyBytes } from '@perfsee/shared'

import { BaseObjectStorage } from './provider'

const debug = debugFactory('perfsee:local-obj-storage')

export class ObjectStorage extends BaseObjectStorage {
  basePath: string
  constructor(dirname = '.local-object-storage') {
    super()
    this.basePath = join(process.cwd(), dirname)
  }

  async get(name: string): Promise<Buffer> {
    debug(`getting ${name} from local object storage...`)
    return fs.readFile(this.nameToPath(name))
  }

  async getStream(name: string) {
    debug(`getting ${name} stream from local object storage...`)
    const stream = createReadStream(this.nameToPath(name))
    stream.on('error', (err) => {
      stream.destroy()
      debug(`read stream error: ${err.message}`)
    })
    return Promise.resolve(stream)
  }

  async upload(name: string, buf: Buffer) {
    debug(`uploading ${name} to local object storage, file size: ${PrettyBytes.stringify(buf.byteLength)}`)
    const filePath = this.nameToPath(name)
    await fs.mkdir(parse(filePath).dir, { recursive: true })
    await fs.writeFile(filePath, buf)
  }

  async uploadFile(name: string, file: string) {
    debug(`uploading file ${name} to local object storage...}`)
    await fs.copyFile(file, this.nameToPath(name))
  }

  private nameToPath(name: string) {
    return join(this.basePath, name)
  }
}

export class LogObjectStorage extends ObjectStorage {}
