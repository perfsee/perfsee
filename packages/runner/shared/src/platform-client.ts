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

import assert from 'assert'
import { createReadStream } from 'fs'
import { stat } from 'fs/promises'

import { merge } from 'lodash'
import fetch, { RequestInit, BodyInit } from 'node-fetch'

import { ServerConfig } from './types'

export class PlatformClient {
  constructor(private readonly config: ServerConfig) {}

  async getArtifact(name: string) {
    const res = await this.fetch(`/api/jobs/artifacts?key=${name}`, { method: 'GET' })
    if (res.ok) {
      return res.buffer()
    }

    throw new Error('Failed to download job artifact.')
  }

  async getArtifactStream(name: string) {
    const res = await this.fetch(`/api/jobs/artifacts?key=${name}`, { method: 'GET' })
    if (res.ok) {
      return res.body
    }

    throw new Error('Failed to download job artifact.')
  }

  async uploadArtifact(name: string, body: BodyInit) {
    const res = await this.fetch(`/api/jobs/artifacts?key=${name}`, {
      method: 'POST',
      body,
      headers: {
        'content-type': 'application/octet-stream',
      },
    })

    if (!res.ok) {
      throw new Error('Failed to upload artifact.')
    }
  }

  async uploadArtifactFile(name: string, path: string) {
    try {
      assert((await stat(path)).isFile(), 'is not a file')
    } catch (e) {
      throw new Error('Failed to upload artifact.' + e)
    }
    return this.uploadArtifact(name, createReadStream(path))
  }

  async jsonFetch(
    path: string,
    init: Omit<RequestInit, 'body'> & {
      body?: Record<string, any>
    },
  ) {
    const { body, ...options } = init
    return this.fetch(
      path,
      merge(
        {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
          },
        },
        options,
        {
          body: JSON.stringify(body),
        },
      ),
    )
  }

  async fetch(path: string, init?: RequestInit) {
    return this.doFetch(
      path,
      merge(
        {
          headers: {
            'x-runner-token': this.config.token,
          },
          timeout: this.config.timeout * 1000,
        },
        init,
      ),
    )
  }

  async doFetch(path: string, init?: RequestInit) {
    return fetch(this.config.url + path, init)
  }
}
