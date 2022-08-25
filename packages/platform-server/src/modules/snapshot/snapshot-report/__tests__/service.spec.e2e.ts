import { faker } from '@faker-js/faker'

import { Page, Project, Snapshot } from '@perfsee/platform-server/db'
import test, { GraphQLTestingClient, initTestDB, create } from '@perfsee/platform-server/test'
import { snapshotReportHistoryQuery, snapshotReportQuery, snapshotReportsQuery } from '@perfsee/schema'
import { SnapshotStatus } from '@perfsee/server-common'

import { mockCreateReport } from './utils'

let gqlClient: GraphQLTestingClient

test.before(async () => {
  await initTestDB()
  gqlClient = new GraphQLTestingClient()
})

test.serial('get snapshot reports by snapshot id', async (t) => {
  const project = await Project.findOneByOrFail({ id: 1 })
  const snapshot = await create(Snapshot, { projectId: project.id })
  const report1 = await mockCreateReport(project.id, { snapshotId: snapshot.id })
  const report2 = await mockCreateReport(project.id, { snapshotId: snapshot.id })

  const response = await gqlClient.query({
    query: snapshotReportsQuery,
    variables: { projectId: project.slug, snapshotId: snapshot.iid },
  })

  t.is(response.project.snapshot.snapshotReports.length, 2)
  t.is(response.project.snapshot.snapshotReports[0].id, report1.iid)
  t.is(response.project.snapshot.snapshotReports[1].id, report2.iid)
})

test.serial('get snapshot report by id', async (t) => {
  const project = await Project.findOneByOrFail({ id: 1 })
  const snapshot = await create(Snapshot, { projectId: project.id })
  const report = await mockCreateReport(project.id, { snapshotId: snapshot.id })

  const response = await gqlClient.query({
    query: snapshotReportQuery,
    variables: { projectId: project.slug, reportId: report.iid },
  })

  t.is(response.project.snapshotReport.snapshot.id, snapshot.iid)
  t.is(response.project.snapshotReport.id, report.iid)
})

test.serial('get snapshot reports by hash filter', async (t) => {
  const project = await Project.findOneByOrFail({ id: 1 })
  const hash = faker.git.commitSha()
  const snapshot = await create(Snapshot, { projectId: project.id, hash })

  const report = await mockCreateReport(project.id, { snapshotId: snapshot.id, status: SnapshotStatus.Completed })
  await mockCreateReport(project.id, { status: SnapshotStatus.Completed })

  const response = await gqlClient.query({
    query: snapshotReportHistoryQuery,
    variables: { projectId: project.slug, filter: { hash } },
  })

  t.is(response.project.snapshotReports.length, 1)
  t.is(response.project.snapshotReports[0].id, report.iid)
})

test.serial('get snapshot reports by iid filter', async (t) => {
  const project = await Project.findOneByOrFail({ id: 1 })

  const reports = [
    await mockCreateReport(project.id, { status: SnapshotStatus.Completed }),
    await mockCreateReport(project.id),
    await mockCreateReport(project.id),
  ]

  const response = await gqlClient.query({
    query: snapshotReportHistoryQuery,
    variables: { projectId: project.slug, filter: { ids: reports.map((r) => r.iid) } },
  })

  t.is(response.project.snapshotReports.length, 3)
  t.is(response.project.snapshotReports[0].id, reports[0].iid)
})

test.serial('get snapshot reports by pageId filter', async (t) => {
  const project = await Project.findOneByOrFail({ id: 1 })
  const page = await create(Page)

  const reports = [
    await mockCreateReport(project.id, { pageId: page.id, status: SnapshotStatus.Completed }),
    await mockCreateReport(project.id),
  ]

  const response = await gqlClient.query({
    query: snapshotReportHistoryQuery,
    variables: { projectId: project.slug, filter: { pageId: page.iid } },
  })

  t.is(response.project.snapshotReports.length, 1)
  t.is(response.project.snapshotReports[0].id, reports[0].iid)
})
