import test from 'ava'

import { parseGitRemoteUrl } from '../git'

const gitRemoteFixtures = [
  'git@github.com:a/b.git',
  'git@github.com:a-b_c/d-e.git',
  'git@github.com:a.b.c/d.e.git',
  'git@some.other.domain:a.b.c/d.e.git',
  'gitlab@gitlab.com:a/b.git',
  'http://github.com/a/b',
  'http://github.com/a/b.git',
  'http://github.com/a-b_c/d-e.git',
  'http://github.com/a.b.c/d.git',
  'https://github.com/a/b',
  'https://some.other.domain/a.b.c/d.e.git',
  'https://a.com',
  'https://a.com/b.git',
]

test('should get git project info correctly', (t) => {
  gitRemoteFixtures.forEach((remote) => {
    t.snapshot(parseGitRemoteUrl(remote), `parse '${remote}'`)
  })
})
