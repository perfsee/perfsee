import test from 'ava'

import { serverLink } from '../links'

test('serverLink', (t) => {
  const [foo, bar, baz] = ['foo', 'bar', 'baz']
  t.deepEqual(
    [
      serverLink`/health`,
      serverLink`${foo}`,
      serverLink`/health/${foo}`,
      serverLink`${foo}/health`,
      serverLink`${foo}${bar}${baz}/health`,
      serverLink`/api/${foo}/scripts/${bar}/${baz}`,
    ],
    ['/health', '/foo', '/health/foo', '/foo/health', '/foobarbaz/health', '/api/foo/scripts/bar/baz'],
  )
})
