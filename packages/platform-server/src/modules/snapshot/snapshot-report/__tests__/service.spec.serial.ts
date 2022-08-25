import { faker } from '@faker-js/faker'

import { Environment, Page, Snapshot, PageWithCompetitor } from '@perfsee/platform-server/db'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'
import { SnapshotStatus } from '@perfsee/server-common'

import { SnapshotReportService } from '../service'
import { SnapshotReportFilter } from '../types'

import { mockCreateReport } from './utils'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [SnapshotReportService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

test.serial('get reports by iids', async (t) => {
  const projectId = 1
  const savedReports = [await mockCreateReport(projectId), await mockCreateReport(projectId)]

  const service = t.context.module.get(SnapshotReportService)
  const reports = await service.getReportsByIids(
    projectId,
    savedReports.map((r) => r.iid),
  )

  t.is(reports.length, 2)
  t.is(reports[0].id, savedReports[0].id)
  t.is(reports[1].id, savedReports[1].id)
})

test.serial('get reports by commit hash', async (t) => {
  const projectId = 1
  const hash = faker.git.commitSha()

  const snapshot = await create(Snapshot, { projectId, hash })

  await mockCreateReport(projectId, { snapshotId: snapshot.id })
  await mockCreateReport(projectId, { snapshotId: snapshot.id })
  await mockCreateReport(projectId)
  await mockCreateReport(projectId)

  const service = t.context.module.get(SnapshotReportService)
  const reports = await service.getReportsByCommitHash(projectId, hash)

  t.is(reports.length, 2)
  t.is(reports[0].snapshotId, snapshot.id)
})

test.serial('filter reports by none', async (t) => {
  const projectId = 1

  await mockCreateReport(projectId, { status: SnapshotStatus.Completed })
  await mockCreateReport(projectId, { status: SnapshotStatus.Completed })
  await mockCreateReport(projectId)
  await mockCreateReport(projectId)

  const service = t.context.module.get(SnapshotReportService)

  const filter = {} as SnapshotReportFilter

  const reports = await service.filterReports(projectId, filter)
  t.is(reports.length, 2)
  t.is(reports[0].status, SnapshotStatus.Completed)
})

test.serial('filter reports by envIid', async (t) => {
  const projectId = 1
  const env = await create(Environment, { projectId })

  await mockCreateReport(projectId, { envId: env.id, status: SnapshotStatus.Completed })
  await mockCreateReport(projectId, { envId: env.id, status: SnapshotStatus.Completed })
  await mockCreateReport(projectId, { status: SnapshotStatus.Completed })
  await mockCreateReport(projectId, { status: SnapshotStatus.Completed })

  const service = t.context.module.get(SnapshotReportService)

  const filter = { envIid: env.iid } as SnapshotReportFilter

  const reports = await service.filterReports(projectId, filter)

  t.is(reports.length, 2)
  t.is(reports[0].envId, env.id)
})

test.serial('filter reports by pageIid with competitor page', async (t) => {
  const projectId = 1
  const page = await create(Page, { projectId })
  const competitor = await create(Page, { projectId, isCompetitor: true })
  await create(PageWithCompetitor, { pageId: page.id, competitorId: competitor.id })

  await mockCreateReport(projectId, { pageId: page.id, status: SnapshotStatus.Completed })
  await mockCreateReport(projectId, { pageId: competitor.id, status: SnapshotStatus.Completed })
  await mockCreateReport(projectId, { status: SnapshotStatus.Completed })
  await mockCreateReport(projectId, { status: SnapshotStatus.Completed })

  const service = t.context.module.get(SnapshotReportService)

  const filter = { pageIid: page.iid, withCompetitor: true } as SnapshotReportFilter

  const reports = await service.filterReports(projectId, filter)

  t.is(reports.length, 2)
  t.is(reports[0].pageId, competitor.id)
  t.is(reports[1].pageId, page.id)
})
