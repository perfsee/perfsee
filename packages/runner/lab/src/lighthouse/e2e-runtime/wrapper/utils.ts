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

import type { HandleFor } from 'puppeteer-core'

export function NotSupportFunction(functionName: string) {
  return (..._: any[]): any => {
    throw new Error(`\`${functionName}\` not support`)
  }
}

export function IgnoreFunction(..._: any[]): any {}

export const DEFAULT_APPEND_TIMEOUT = 5000

export async function getContentFromHandle(handle: HandleFor<any>) {
  try {
    const innerText: string = await handle.evaluate((e) => e.textContent)
    if (innerText) {
      return `\`${innerText.length > 30 ? innerText.slice(0, 29) + '...' : innerText}\``
    }
    const tagName: string = await handle.evaluate((e) => e.tagName)
    if (tagName) {
      return `<${tagName.toLowerCase()}>`
    }
    return ''
  } catch {
    return ''
  }
}
