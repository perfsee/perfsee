import { Project } from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB } from '@perfsee/platform-server/test'
import { projectUsageQuery } from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let slug: string

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()
  slug = (await Project.findOneByOrFail({ id: 1 })).slug
})

test.serial('get usage and usage limit', async (t) => {
  const response = await gqlClient.query({
    query: projectUsageQuery,
    variables: { projectId: slug },
  })

  t.is(response.project.usage.jobCount, 0)
  t.is(response.project.usage.jobDuration, 0)
  t.is(response.project.usage.storage, 0)
  t.is(response.project.usagePack.jobCountMonthly, -1)
  t.is(response.project.usagePack.jobDurationMonthly, -1)
  t.is(response.project.usagePack.storage, -1)
})
