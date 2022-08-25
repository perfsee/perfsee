import { faker } from '@faker-js/faker'

import { Project, Environment, SnapshotReport, User } from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB, create } from '@perfsee/platform-server/test'
import { deleteEnvironmentMutation, updateEnvironmentMutation } from '@perfsee/schema'

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

test.serial('create environment', async (t) => {
  const name = faker.word.noun()
  const response = await gqlClient.query({
    query: updateEnvironmentMutation,
    variables: {
      projectId: slug,
      envInput: {
        name,
        disable: true,
      },
    },
  })

  const environment = await Environment.findOneBy({ projectId: 1, iid: response.updateEnvironment.id })

  t.truthy(environment)
  t.is(response.updateEnvironment.id, environment!.iid)
  t.is(response.updateEnvironment.name, name)
  t.true(response.updateEnvironment!.disable)
  t.true(environment!.disable)
})

test.serial('update environment', async (t) => {
  const environment = await create(Environment)

  const name = faker.word.noun()
  const response = await gqlClient.query({
    query: updateEnvironmentMutation,
    variables: {
      projectId: slug,
      envInput: {
        id: environment.iid,
        name,
        disable: true,
      },
    },
  })

  t.is(response.updateEnvironment.id, environment!.iid)
  t.is(response.updateEnvironment.name, name)
  t.true(response.updateEnvironment.disable)
})

test.serial('delete environment', async (t) => {
  const report = await mockCreateReport(1)
  const environment = await Environment.findOneByOrFail({ id: report.envId })

  const response = await gqlClient.query({
    query: deleteEnvironmentMutation,
    variables: {
      projectId: slug,
      id: environment.iid,
    },
  })

  const noEnvironment = await Environment.findOneBy({ id: environment.id })
  const noReport = await SnapshotReport.findOneBy({ id: report.id })

  t.true(response.deleteEnvironment)
  t.falsy(noEnvironment)
  t.falsy(noReport)
})

test.serial('update environment with no permission', async (t) => {
  await gqlClient.loginAs(user)
  const environment = await create(Environment)

  await t.throwsAsync(
    async () => {
      await gqlClient.query({
        query: updateEnvironmentMutation,
        variables: {
          projectId: slug,
          envInput: {
            id: environment.iid,
            disable: true,
          },
        },
      })
    },
    { instanceOf: Error, message: `[User Error] Unauthorized user` },
  )
})

test.serial('delete environment with no permission', async (t) => {
  await gqlClient.loginAs(user)

  const environment = await Environment.findOneByOrFail({ projectId: 1 })

  await t.throwsAsync(
    async () => {
      await gqlClient.query({
        query: deleteEnvironmentMutation,
        variables: {
          projectId: slug,
          id: environment.iid,
        },
      })
    },
    { instanceOf: Error, message: `[User Error] Unauthorized user` },
  )
})
