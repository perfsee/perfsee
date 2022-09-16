import { faker } from '@faker-js/faker'

import { Project, Snapshot, SnapshotReport, User } from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB, create } from '@perfsee/platform-server/test'
import { snapshotsQuery, setSnapshotHashMutation, deleteSnapshotMutation, takeSnapshotMutation } from '@perfsee/schema'

import { mockCreateReport } from '../snapshot-report/__tests__/utils'

let gqlClient: GraphQLTestingClient
let slug: string

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()
  slug = (await Project.findOneByOrFail({ id: 1 })).slug
})

test.serial('get snapshots', async (t) => {
  await create(Snapshot, { projectId: 1 })
  const snapshot = await create(Snapshot, { projectId: 1 })

  const response = await gqlClient.query({
    query: snapshotsQuery,
    variables: { projectId: slug },
  })

  t.like(response.project.snapshots.pageInfo, { totalCount: 2 })
  t.is(response.project.snapshots.edges[0].node.id, snapshot.iid)
})

test.serial('set the commit hash associated with the snapshot', async (t) => {
  const snapshot = await create(Snapshot, { projectId: 1 })
  const hash = faker.git.commitSha()

  const response = await gqlClient.query({
    query: setSnapshotHashMutation,
    variables: {
      projectId: slug,
      snapshotId: snapshot.iid,
      hash,
    },
  })

  const updatedSnapshot = await Snapshot.findOneByOrFail({ id: snapshot.id })

  t.true(response.setSnapshotHash)
  t.is(updatedSnapshot.hash, hash)
})

test.serial('unable to take snapshot by no permission user', async (t) => {
  const user = await create(User)
  const innerGqlClient = new GraphQLTestingClient()
  await innerGqlClient.loginAs(user)

  await t.throwsAsync(
    async () => {
      await innerGqlClient.mutate({
        mutation: takeSnapshotMutation,
        variables: {
          projectId: slug,
          pageIds: [1],
        },
      })
    },
    { message: '[User Error] Unauthorized user' },
  )
})

test.serial('delete snapshot', async (t) => {
  const snapshot = await create(Snapshot, { projectId: 1 })
  const report = await mockCreateReport(1, { snapshotId: snapshot.id })

  const response = await gqlClient.query({
    query: deleteSnapshotMutation,
    variables: {
      projectId: slug,
      snapshotId: snapshot.iid,
    },
  })

  const noSnapshot = await Snapshot.findOneBy({ id: snapshot.id })
  const noReport = await SnapshotReport.findOneBy({ id: report.id })

  t.true(response.deleteSnapshot)
  t.falsy(noSnapshot)
  t.falsy(noReport)
})
