import { faker } from '@faker-js/faker'

import { Profile } from '@perfsee/platform-server/db'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'

import { SnapshotReportService } from '../../snapshot/snapshot-report/service'
import { ProfileService } from '../service'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [ProfileService, SnapshotReportService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

test.serial('get profile by iid', async (t) => {
  const created = await create(Profile)

  const service = t.context.module.get(ProfileService)
  const profile = await service.getProfile(created.projectId, created.iid)

  t.deepEqual(profile, created)
})

test.serial('get profiles', async (t) => {
  const projectId = 1
  await create(Profile, { projectId, disable: true })
  await create(Profile, { projectId })

  const service = t.context.module.get(ProfileService)
  const profiles = await service.getProfiles(1)

  t.is(profiles.length, 2)
  t.true(profiles[0].disable)
})

test.serial('create profile', async (t) => {
  const projectId = 1
  const service = t.context.module.get(ProfileService)
  const internalIdService = t.context.module.get(InternalIdService)
  internalIdService.generate.resolves(1)

  const payload = {
    name: faker.word.noun(),
  }

  const profile = await service.updateProfile(projectId, payload)

  t.truthy(profile.id)
  t.is(profile.name, payload.name)
  t.is(profile.device, 'no')
  t.is(profile.iid, 1)
  t.false(profile.disable)
})

test.serial('update profile', async (t) => {
  const projectId = 1
  const profile = await create(Profile, { projectId })
  const service = t.context.module.get(ProfileService)

  const payload = {
    name: faker.word.noun(),
    iid: profile.iid,
  }

  const updatedProfile = await service.updateProfile(projectId, payload)

  t.is(payload.name, updatedProfile.name)
})
