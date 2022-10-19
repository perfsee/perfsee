import { faker } from '@faker-js/faker'

import { Artifact, Project } from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB, create } from '@perfsee/platform-server/test'
import { artifactQuery, artifactsQuery, artifactWithBaselineQuery } from '@perfsee/schema'

let gqlClient: GraphQLTestingClient
let slug: string
const projectId = 1

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()
  slug = (await Project.findOneByOrFail({ id: projectId })).slug
})

test.serial('get artifact', async (t) => {
  const iid = 1
  const artifact = await create(Artifact, { projectId, iid, name: faker.datatype.string() })

  const result = await gqlClient.query({
    query: artifactQuery,
    variables: {
      projectId: slug,
      id: iid,
    },
  })

  t.is(result.project.artifact.name, artifact.name)
})

test.serial('get artifacts', async (t) => {
  const { id, slug } = await create(Project)
  await create(Artifact, { projectId: id })
  const artifact = await create(Artifact, { projectId: id })

  const result = await gqlClient.query({
    query: artifactsQuery,
    variables: {
      projectId: slug,
    },
  })

  t.like(result.project.artifacts.pageInfo, { totalCount: 2 })
  t.is(result.project.artifacts.edges[0].node.id, artifact.iid)
})

test.serial('resolve baseline', async (t) => {
  const baseline = await create(Artifact, { projectId, isBaseline: true })
  const artifact = await create(Artifact, { projectId, baselineId: baseline.id })

  const result = await gqlClient.query({
    query: artifactWithBaselineQuery,
    variables: {
      projectId: slug,
      id: artifact.iid,
    },
  })

  t.is(result.project.artifact.baseline?.id, baseline.iid)
})
