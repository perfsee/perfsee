import test from 'ava'

import { SIMPLE_URL_REGEXP } from '../constants'

const correctUrls = [
  'http://example.com',
  'https://localhost:8080',
  'https://localhost',
  'https://example.com',
  'https://example.com:8080',
  'https://example.com/',
  'https://example.com/path',
  'https://127.0.0.1:8080',
  'https://127.0.0.1:8080/path',
]

test('should match simple url', (t) => {
  correctUrls.forEach((url) => {
    t.assert(SIMPLE_URL_REGEXP.test(url), url)
  })
})
