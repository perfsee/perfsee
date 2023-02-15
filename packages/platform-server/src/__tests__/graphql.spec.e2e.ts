import test from 'ava'

import { GraphQLTestingClient, initTestDB } from '@perfsee/platform-server/test'
import { projectQuery } from '@perfsee/schema'

import { Project } from '../db'

let gqlClient: GraphQLTestingClient

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()
})

test.serial('get project', async (t) => {
  const project = await Project.findOneByOrFail({ id: 1 })
  const response = await gqlClient.query({
    query: projectQuery,
    variables: { projectId: project.slug },
  })

  t.is(response.project!.name, project.name)
})
