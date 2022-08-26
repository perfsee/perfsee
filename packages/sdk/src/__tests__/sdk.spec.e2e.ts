import config from 'config'

import {
  Environment,
  Page,
  PageWithCompetitor,
  PageWithEnv,
  PageWithProfile,
  Profile,
  Project,
  Snapshot,
} from '@perfsee/platform-server/db'
import test, { initTestDB, seedProjectProperty } from '@perfsee/platform-server/test'

import { Client } from '../client'

let project: Project
let seeded: {
  pages: Page[]
  envs: Environment[]
  profiles: Profile[]
  pageWithEnv: PageWithEnv[]
  pageWithProfile: PageWithProfile[]
  pageWithCompetitor: PageWithCompetitor
}
let client: Client

test.before(async () => {
  await initTestDB()
  project = await Project.findOneByOrFail({ id: 1 })
  const [pages, envs, profiles, pageWithEnv, pageWithProfile, pageWithCompetitor] = await seedProjectProperty(1)
  seeded = {
    pages,
    envs,
    profiles,
    pageWithEnv,
    pageWithProfile,
    pageWithCompetitor,
  }

  client = new Client({
    // admin user created in db/fixtures/seed.ts
    accessToken: 'uadmin-test-token',
    host: config.host,
  })
})

test.serial('get page relations', async (t) => {
  const { pages, profiles, environments } = await client.projectSettings(project.slug)
  t.deepEqual(
    seeded.pages.map((p) => p.iid),
    pages.map((p) => p.id),
  )
  t.deepEqual(
    seeded.profiles.map((p) => p.iid),
    profiles.map((p) => p.id),
  )
  t.deepEqual(
    seeded.envs.map((p) => p.iid),
    environments.map((p) => p.id),
  )
})

test.serial('take snapshot', async (t) => {
  const snapshot = await client.takeSnapshot(project.slug, [seeded.pages[0].iid])
  t.truthy(snapshot)

  t.truthy(await Snapshot.findOneByOrFail({ projectId: project.id, iid: snapshot.id }))
})
