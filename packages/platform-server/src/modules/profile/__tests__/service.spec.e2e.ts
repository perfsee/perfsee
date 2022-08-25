import { faker } from '@faker-js/faker'
import { pick } from 'lodash'

import { Project, Profile, SnapshotReport, User } from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB, create } from '@perfsee/platform-server/test'
import { deleteProfileMutation, updateProfileMutation, settingPropertyQuery } from '@perfsee/schema'
import { CONNECTIONS, DEVICES } from '@perfsee/shared'

import { mockCreateReport } from '../../snapshot/snapshot-report/__tests__/utils'

let gqlClient: GraphQLTestingClient
let slug: string
let user: User

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()
  slug = (await Project.findOneByOrFail({ id: 1 })).slug
  user = await create(User)
})

test.serial('get built in profile', async (t) => {
  const response = await gqlClient.query({
    query: settingPropertyQuery,
  })

  t.deepEqual(response.connections, CONNECTIONS)
  t.deepEqual(
    response.devices,
    DEVICES.map((d) => pick(d, 'id', 'value')),
  )
})

test.serial('create profile', async (t) => {
  const name = faker.word.noun()
  const response = await gqlClient.query({
    query: updateProfileMutation,
    variables: {
      projectId: slug,
      profileInput: {
        name,
        disable: true,
      },
    },
  })

  const profile = await Profile.findOneBy({ projectId: 1, iid: response.updateOrCreateProfile.id })

  t.truthy(profile)
  t.is(response.updateOrCreateProfile.id, profile!.iid)
  t.is(response.updateOrCreateProfile.name, name)
  t.true(response.updateOrCreateProfile!.disable)
  t.true(profile!.disable)
})

test.serial('update profile', async (t) => {
  const profile = await create(Profile)

  const name = faker.word.noun()
  const device = DEVICES[1].id
  const response = await gqlClient.query({
    query: updateProfileMutation,
    variables: {
      projectId: slug,
      profileInput: {
        id: profile.iid,
        name,
        device,
      },
    },
  })

  t.is(response.updateOrCreateProfile.id, profile!.iid)
  t.is(response.updateOrCreateProfile.name, name)
  t.is(response.updateOrCreateProfile.device, device)
})

test.serial('delete profile', async (t) => {
  const report = await mockCreateReport(1)
  const profile = await Profile.findOneByOrFail({ id: report.profileId })

  const response = await gqlClient.query({
    query: deleteProfileMutation,
    variables: {
      projectId: slug,
      id: profile.iid,
    },
  })

  const noProfile = await Profile.findOneBy({ id: profile.id })
  const noReport = await SnapshotReport.findOneBy({ id: report.id })

  t.true(response.deleteProfile)
  t.falsy(noProfile)
  t.falsy(noReport)
})

test.serial('update profile with no permission', async (t) => {
  await gqlClient.loginAs(user)

  const profile = await create(Profile)

  await t.throwsAsync(
    async () => {
      await gqlClient.query({
        query: updateProfileMutation,
        variables: {
          projectId: slug,
          profileInput: {
            id: profile.iid,
            name: faker.word.noun(),
          },
        },
      })
    },
    { instanceOf: Error, message: `[User Error] Unauthorized user` },
  )
})

test.serial('delete profile with no permission', async (t) => {
  await gqlClient.loginAs(user)

  const profile = await Profile.findOneByOrFail({ projectId: 1 })

  await t.throwsAsync(
    async () => {
      await gqlClient.query({
        query: deleteProfileMutation,
        variables: {
          projectId: slug,
          id: profile.iid,
        },
      })
    },
    { instanceOf: Error, message: `[User Error] Unauthorized user` },
  )
})
