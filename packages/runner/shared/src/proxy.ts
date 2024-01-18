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
import { join } from 'path'
import { promisify } from 'util'

import { noop } from 'lodash'

export const clearProxyCache = (function () {
  try {
    if (process.env.ENABLE_PROXY || process.env.NODE_ENV === 'production') {
      const { clearCache } = require('@perfsee/iri')
      return promisify(clearCache)
    }
  } catch (e) {
    console.warn('@perfsee/iri module is not available, clear cache failed.')
  }
  return noop
})()

export const startProxyServer = (function () {
  if (process.env.ENABLE_PROXY || process.env.NODE_ENV === 'production') {
    return () => {
      try {
        const { startServer } = require('@perfsee/iri')
        if (process.env.NODE_ENV === 'production') {
          execSync(`${join(process.cwd(), 'mkcert')} -install`, {
            stdio: 'inherit',
          })
        }
        startServer((err: Error | null) => {
          if (err) {
            console.error('Proxy server error', err)
          }
        })
      } catch (e) {
        console.warn('@perfsee/iri module is not available, start proxy server failed.')
      }
    }
  }
  return noop
})()
