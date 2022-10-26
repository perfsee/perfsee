import { User } from '@perfsee/platform-server/db'
import test, { create, GraphQLTestingClient, initTestDB } from '@perfsee/platform-server/test'
import {
  globalStateQuery,
  registrationTokenQuery,
  resetRegistrationTokenMutation,
  settingPropertyQuery,
  addJobZonesMutation,
  deleteJobZonesMutation,
  setDefaultJobZoneMutation,
} from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let admin: User
let user: User

test.before(async () => {
  await initTestDB(false)
  gqlClient = new GraphQLTestingClient()
  ;[admin, user] = await create(User, [{ isAdmin: true }, { isAdmin: false }])
})

test.serial('should be able to get application settings', async (t) => {
  gqlClient.logout()
  const { applicationSettings } = await gqlClient.query({ query: globalStateQuery })
  t.snapshot(applicationSettings)
})

test.serial('should only admin can access registration token setting', async (t) => {
  await gqlClient.loginAs(user)
  await t.throwsAsync(
    gqlClient.query({
      query: registrationTokenQuery,
    }),
    {
      message: 'Forbidden access',
    },
  )

  await gqlClient.loginAs(admin)

  const { applicationSettings } = await gqlClient.query({
    query: registrationTokenQuery,
  })
  t.truthy(applicationSettings.registrationToken)
})

test.serial('should be able to reset registration token', async (t) => {
  await gqlClient.loginAs(user)

  await t.throwsAsync(
    gqlClient.mutate({
      mutation: resetRegistrationTokenMutation,
    }),
    {
      message: '[User Error] Unauthorized user',
    },
  )

  await gqlClient.loginAs(admin)

  const { resetRegistrationToken } = await gqlClient.mutate({
    mutation: resetRegistrationTokenMutation,
  })

  t.truthy(resetRegistrationToken)
})

test.serial('should be able to get job zones', async (t) => {
  await gqlClient.loginAs(user)

  const { zone } = await gqlClient.query({
    query: settingPropertyQuery,
  })
  t.assert(zone.all.length > 0)
  t.assert(zone.all.includes(zone.default))
})

test.serial('should be able to insert new job zones', async (t) => {
  await gqlClient.loginAs(user)

  await t.throwsAsync(
    gqlClient.mutate({
      mutation: addJobZonesMutation,
      variables: {
        zones: ['test1', 'test2'],
      },
    }),
    {
      message: '[User Error] Unauthorized user',
    },
  )

  await gqlClient.loginAs(admin)

  const { insertAvailableJobZones } = await gqlClient.mutate({
    mutation: addJobZonesMutation,
    variables: {
      zones: ['test1', 'test2'],
    },
  })

  t.assert(insertAvailableJobZones.length > 2)
  t.assert(insertAvailableJobZones.includes('test1'))
  t.assert(insertAvailableJobZones.includes('test2'))
})

test.serial('should be able to delete job zones', async (t) => {
  await gqlClient.loginAs(user)

  await t.throwsAsync(
    gqlClient.mutate({
      mutation: deleteJobZonesMutation,
      variables: {
        zones: ['test1', 'test2'],
      },
    }),
    {
      message: '[User Error] Unauthorized user',
    },
  )

  await gqlClient.loginAs(admin)

  const { deleteAvailableJobZones } = await gqlClient.mutate({
    mutation: deleteJobZonesMutation,
    variables: {
      zones: ['test1', 'test2'],
    },
  })

  t.assert(deleteAvailableJobZones.length > 0)
  t.assert(!deleteAvailableJobZones.includes('test1'))
  t.assert(!deleteAvailableJobZones.includes('test2'))

  await t.throwsAsync(
    gqlClient.mutate({
      mutation: deleteJobZonesMutation,
      variables: {
        zones: [perfsee.job.defaultZone],
      },
    }),
    {
      message: /Could not delete default job zone/,
    },
  )
})

test.serial('should be able to set default job zone', async (t) => {
  await gqlClient.loginAs(user)

  await t.throwsAsync(
    gqlClient.mutate({
      mutation: setDefaultJobZoneMutation,
      variables: {
        zone: 'test',
      },
    }),
    {
      message: '[User Error] Unauthorized user',
    },
  )

  await gqlClient.loginAs(admin)

  await gqlClient.mutate({
    mutation: addJobZonesMutation,
    variables: {
      zones: ['test'],
    },
  })

  const { setDefaultJobZone } = await gqlClient.mutate({
    mutation: setDefaultJobZoneMutation,
    variables: {
      zone: 'test',
    },
  })
  t.assert(setDefaultJobZone === 'test')
  const { zone } = await gqlClient.query({
    query: settingPropertyQuery,
  })
  t.assert(zone.default === setDefaultJobZone)
})
