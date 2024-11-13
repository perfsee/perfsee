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

import puppeteer from 'puppeteer-core'

import { findChrome } from '@perfsee/chrome-finder'

export type BrowserOptions = Parameters<typeof puppeteer.launch>[0] & {
  enableProxy?: boolean
  withCache?: string | false
}

export async function createBrowser(options: BrowserOptions = {}) {
  const { executablePath } = await findChrome()
  if (!executablePath) {
    throw new Error('Failed find chrome executable binary path.')
  }

  // https://codereview.chromium.org/2384163002
  // https://github.com/puppeteer/puppeteer/issues/1825#issuecomment-529619628
  const chromeArgs = [
    '--no-sandbox',
    '--disable-gpu',
    '--disable-setuid-sandbox',
    '--no-zygote',
    '--disable-dev-shm-usage',
    '--disable-web-security',
  ]

  if (options.enableProxy) {
    chromeArgs.push('--host-rules=MAP * 127.0.0.1')
  }

  const browser = await puppeteer.launch({
    executablePath,
    ignoreHTTPSErrors: true,
    defaultViewport: {
      height: 720,
      width: 1080,
    },
    ...options,
    args: [...chromeArgs, ...(options.args ?? [])],
  })

  // close default created tabs
  await browser.pages().then((pages) => {
    return Promise.allSettled(
      pages.map(async (page) => {
        await page.close()
      }),
    )
  })

  return browser
}
