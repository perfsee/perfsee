import test from 'ava'

import { artifactLink } from '../artifact-link'

test('should return artifact link', (t) => {
  const link = artifactLink('artifacts/key/subpath/file.json')
  t.is(link, `${perfsee.baseUrl}/artifacts/key/subpath/file.json`)
})

test('should throw if given key is not valid', (t) => {
  t.throws(() => artifactLink('key/subpath/file.json'), {
    message: 'The artifact key must start with "artifacts/", given key/subpath/file.json',
  })
})
