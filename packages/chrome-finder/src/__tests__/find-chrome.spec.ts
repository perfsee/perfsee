import test from 'ava'

import { findChrome } from '..'

test('should find local suitable chromium', async (t) => {
  const chromeInfo = await findChrome()

  t.truthy(chromeInfo.browser)
  t.truthy(chromeInfo.executablePath)
})

test('should throw if chrome version not match', (t) => {
  t.throws(() => findChrome({ max: 86 }))
})
