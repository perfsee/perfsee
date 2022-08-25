import { join } from 'path'

import test from 'ava'
import puppeteer from 'puppeteer-core'

import { findChrome } from '..'

test.only('should find local suitable chromium', async (t) => {
  const chromeInfo = await findChrome()

  t.truthy(chromeInfo.browser)
  t.truthy(chromeInfo.executablePath)
})

test('should throw if chrome version not match', async (t) => {
  await t.throwsAsync(findChrome({ max: 86 }))
})

test('should download if config specified', async (t) => {
  const downloadPath = join(__dirname, '../', '../', 'dist', 'chrome')
  const chromeInfo = await findChrome({
    min: 66,
    max: 66,
    download: {
      // @ts-expect-error wrong type
      puppeteer,
      // 66
      revision: '538022',
      path: downloadPath,
    },
  })

  t.assert(/(Chrome|Chromium)\s66\..+/.test(chromeInfo.browser!))
  t.assert(chromeInfo.executablePath?.startsWith(downloadPath))
})
