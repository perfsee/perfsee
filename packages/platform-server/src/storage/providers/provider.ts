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

import fs from 'fs/promises'
import { Readable } from 'stream'

export interface ObjectStorage {
  get: (name: string) => Promise<Buffer>
  getStream: (name: string) => Promise<Readable>
  upload: (name: string, buf: Buffer) => Promise<void>
  uploadFile: (name: string, file: string) => Promise<void>
}

export abstract class BaseObjectStorage implements ObjectStorage {
  abstract get(name: string): Promise<Buffer>
  abstract getStream(name: string): Promise<Readable>
  abstract upload(name: string, buf: Buffer): Promise<void>
  async uploadFile(name: string, file: string) {
    const buf = await fs.readFile(file)
    await this.upload(name, buf)
  }
}
