import test from 'ava'

import { Environment, Page, SnapshotReport, Profile } from '@perfsee/platform-server/db'
import { createMock } from '@perfsee/platform-server/test'

import { getLighthouseRunData } from '../get-lh-run-data'

const config = {
  job: {
    lab: {},
  },
}

test('get lighthouse run data', (t) => {
  const pages = [
    createMock<Page>({
      id: 1,
    }),
    createMock<Page>({
      id: 2,
      url: 'https://localhost',
    }),
  ]
  const profiles = [
    createMock<Profile>({
      id: 1,
      bandWidth: 'wifi',
      device: 'no',
    }),
    createMock<Profile>({
      id: 2,
    }),
  ]
  const envs = [
    createMock<Environment>({
      id: 1,
      headers: [],
      cookies: [],
      localStorage: [],
    }),
    createMock<Environment>({
      id: 2,
      headers: [],
      cookies: [],
      localStorage: [],
    }),
  ]

  const reports = [
    createMock<SnapshotReport>({
      id: 1,
      snapshotId: 2,
      envId: 2,
      profileId: 2,
      pageId: 2,
    }),
    createMock<SnapshotReport>({
      id: 2,
      snapshotId: 1,
      envId: 1,
      profileId: 1,
      pageId: 1,
    }),
  ]

  t.snapshot(getLighthouseRunData(pages, profiles, envs, reports, config as any))
})
