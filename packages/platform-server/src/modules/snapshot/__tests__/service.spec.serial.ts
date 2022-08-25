import { faker } from '@faker-js/faker'

import {
  Snapshot,
  Project,
  SnapshotTrigger,
  Page,
  SnapshotReport,
  Environment,
  Profile,
  User,
} from '@perfsee/platform-server/db'
import { seedProjectProperty } from '@perfsee/platform-server/db/fixtures'
import { EventEmitter } from '@perfsee/platform-server/event'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import { Metric } from '@perfsee/platform-server/metrics'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'
import { SnapshotStatus } from '@perfsee/server-common'

import { PageService } from '../../page/service'
import { SnapshotService } from '../service'
import { mockCreateReport } from '../snapshot-report/__tests__/utils'
import { SnapshotReportService } from '../snapshot-report/service'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [PageService, SnapshotService, SnapshotReportService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

test.serial('get snapshot by id', async (t) => {
  const savedSnapshot = await create(Snapshot, {
    projectId: 1,
    via: 'via',
  })

  const service = t.context.module.get(SnapshotService)
  const snapshot = await service.getSnapshot(1, savedSnapshot.iid)

  t.truthy(snapshot)
  t.assert(savedSnapshot.id === snapshot!.id)
  t.assert(savedSnapshot.status === snapshot!.status)
})

test.serial('get snapshots by project id', async (t) => {
  await create(Snapshot, {
    projectId: 1,
    trigger: SnapshotTrigger.Api,
  })

  const service = t.context.module.get(SnapshotService)
  const [snapshots, count] = await service.getSnapshots(1, { first: 10, skip: 0, after: null })

  t.truthy(snapshots)
  t.assert(count === 1)
  t.assert(snapshots[0].trigger === SnapshotTrigger.Api)
})

test.serial('delete snapshot by iid', async (t) => {
  const project = await Project.findOneByOrFail({ id: 1 })

  const snapshot = await create(Snapshot, {
    projectId: project.id,
  })

  const report = await mockCreateReport(project.id, { snapshotId: snapshot.id })

  const service = t.context.module.get(SnapshotService)
  await service.deleteSnapshotById(project.id, snapshot.iid)

  const noSnapshot = await Snapshot.findOneBy({ id: snapshot.id })
  const noReport = await SnapshotReport.findOneBy({ id: report.id })

  t.is(noSnapshot, null)
  t.is(noReport, null)
})

test.serial('take temp snapshot', async (t) => {
  const projectId = 1
  const service = t.context.module.get(SnapshotService)
  const event = t.context.module.get(EventEmitter)
  const internalIdService = t.context.module.get(InternalIdService)
  const url = faker.internet.url()
  const user = await create(User, { isAdmin: true })
  const env = await create(Environment, { projectId, isCompetitor: true })
  const profile = await create(Profile, { projectId })

  internalIdService.generate.resolves(1)

  const snapshot = await service.takeTempSnapshot(projectId, user.username, url, [profile.iid], env.iid)

  t.true(event.emitAsync.calledOnce)
  t.true(event.emitAsync.calledWith('job.create'))
  t.is(snapshot.status, SnapshotStatus.Pending)
  t.is(await SnapshotReport.countBy({ snapshotId: snapshot.id }), 1)
})

test.serial('take snapshot', async (t) => {
  await seedProjectProperty(1)
  const service = t.context.module.get(SnapshotService)
  const internalIdService = t.context.module.get(InternalIdService)
  const event = t.context.module.get(EventEmitter)

  internalIdService.generate.resolves(1)

  const snapshot = await service.takeSnapshotByPageIds({
    projectId: 1,
    issuer: 'issuer@example.org',
  })

  t.true(event.emitAsync.calledOnce)
  t.true(event.emitAsync.calledWith('job.create'))
  t.is(snapshot.status, SnapshotStatus.Pending)
  // equals to page x profile x env bindings
  // see packages/platform-server/src/db/fixtures/seed.ts
  t.is(await SnapshotReport.countBy({ snapshotId: snapshot.id }), 5)
})

test.serial('take snapshot without pages', async (t) => {
  const project = await create(Project)
  const service = t.context.module.get(SnapshotService)

  await t.throwsAsync(
    async () => {
      await service.takeSnapshotByPageIds({
        projectId: project.id,
        issuer: 'issuer@example.org',
      })
    },
    { instanceOf: Error, message: 'No report created with given configuration.' },
  )
})

test.serial('always create snapshot even if there are no pages', async (t) => {
  const project = await create(Project)
  const service = t.context.module.get(SnapshotService)
  const internalIdService = t.context.module.get(InternalIdService)
  const event = t.context.module.get(EventEmitter)

  internalIdService.generate.resolves(1)

  const snapshot = await service.takeSnapshotByPageIds(
    {
      projectId: project.id,
      issuer: 'issuer@example.org',
    },
    true,
  )

  t.true(event.emitAsync.notCalled)
  t.is(await SnapshotReport.countBy({ snapshotId: snapshot.id }), 0)
})

test.serial('take snapshot with envIid', async (t) => {
  await seedProjectProperty(1)
  const service = t.context.module.get(SnapshotService)
  const internalIdService = t.context.module.get(InternalIdService)
  internalIdService.generate.resolves(1)

  const snapshot = await service.takeSnapshotByPageIds({
    projectId: 1,
    envIids: [1],
    issuer: 'issuer@example.org',
  })

  // equals to page x profile x env bindings
  // see packages/platform-server/src/db/fixtures/seed.ts
  t.is(await SnapshotReport.countBy({ snapshotId: snapshot.id }), 3)
})

test.serial('take snapshot with given property', async (t) => {
  await seedProjectProperty(1)
  const service = t.context.module.get(SnapshotService)
  const internalIdService = t.context.module.get(InternalIdService)
  internalIdService.generate.resolves(1)

  const snapshot = await service.takeSnapshotByPageIds({
    projectId: 1,
    pageIids: [2],
    envIids: [1],
    profileIids: [1],
    issuer: 'issuer@example.org',
  })

  // equals to page x profile x env given
  // see packages/platform-server/src/db/fixtures/seed.ts
  t.is(await SnapshotReport.countBy({ snapshotId: snapshot.id }), 1)
})

test.serial('rerun report', async (t) => {
  const service = t.context.module.get(SnapshotService)
  const event = t.context.module.get(EventEmitter)

  const report = await mockCreateReport(1, { status: SnapshotStatus.Failed })

  await service.dispatchReport(report)

  const updatedReport = await SnapshotReport.findOneByOrFail({ id: report.id })

  t.true(event.emitAsync.calledOnce)
  t.true(event.emitAsync.calledWith('job.create'))
  t.is(updatedReport.status, SnapshotStatus.Pending)
})

test.serial('get report job payload', async (t) => {
  const service = t.context.module.get(SnapshotService)

  const page = await create(Page, { projectId: 1, oversea: true })
  const profile = await create(Profile, { projectId: 1 })
  const environment = await create(Environment, { projectId: 1 })
  const snapshot = await create(Snapshot, { projectId: 1 })

  const report = await create(SnapshotReport, {
    pageId: page.id,
    envId: environment.id,
    profileId: profile.id,
    snapshotId: snapshot.id,
    status: SnapshotStatus.Failed,
    projectId: 1,
  })

  const payload = await service.getReportJobPayload(report.id)

  t.is(payload.reportId, report.id)
  t.is(payload.deviceId, profile.device)
  t.deepEqual(payload.headers, environment.headers)
  t.deepEqual(payload.cookies, environment.cookies)
})

test.serial('update snapshot report when status is completed', async (t) => {
  const service = t.context.module.get(SnapshotService)
  const metricService = t.context.module.get(Metric)

  const report = await mockCreateReport(1)

  const updatedReport = await service.updateSnapshotReport({
    id: report.id,
    lighthouseStorageKey: 'foo',
    status: SnapshotStatus.Completed,
  })

  t.true(metricService.snapshotReportComplete.calledOnce)
  t.true(metricService.snapshotReportFail.notCalled)
  t.is(updatedReport!.lighthouseStorageKey, 'foo')
  t.is(updatedReport!.status, SnapshotStatus.Completed)
})

test.serial('update snapshot report when status is failed', async (t) => {
  const service = t.context.module.get(SnapshotService)
  const metricService = t.context.module.get(Metric)

  const report = await mockCreateReport(1)

  const updatedReport = await service.updateSnapshotReport({
    id: report.id,
    status: SnapshotStatus.Failed,
  })

  t.true(metricService.snapshotReportComplete.notCalled)
  t.true(metricService.snapshotReportFail.calledOnce)
  t.is(updatedReport!.status, SnapshotStatus.Failed)
})

test.serial('try snapshot completed', async (t) => {
  const service = t.context.module.get(SnapshotService)
  const metricService = t.context.module.get(Metric)

  const snapshot = await create(Snapshot, { projectId: 1, status: SnapshotStatus.Running })

  await mockCreateReport(1, { snapshotId: snapshot.id, status: SnapshotStatus.Completed })
  await mockCreateReport(1, { snapshotId: snapshot.id, status: SnapshotStatus.Completed })

  await service.tryCompleteSnapshot(snapshot.id)

  const updateSnapshot = await Snapshot.findOneByOrFail({ id: snapshot.id })
  t.is(metricService.snapshotComplete.callCount, 1)
  t.is(updateSnapshot.status, SnapshotStatus.Completed)
})

test.serial('try snapshot completed when report status is not completed', async (t) => {
  const service = t.context.module.get(SnapshotService)
  const metricService = t.context.module.get(Metric)

  const snapshot = await create(Snapshot, { status: SnapshotStatus.Running })

  await mockCreateReport(1, { snapshotId: snapshot.id, status: SnapshotStatus.Completed })
  await mockCreateReport(1, { snapshotId: snapshot.id, status: SnapshotStatus.Running })

  await service.tryCompleteSnapshot(snapshot.id)

  const updateSnapshot = await Snapshot.findOneByOrFail({ id: snapshot.id })

  t.true(metricService.snapshotComplete.notCalled)
  t.is(updateSnapshot.status, SnapshotStatus.Running)
})
