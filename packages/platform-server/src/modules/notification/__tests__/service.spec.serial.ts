import { faker } from '@faker-js/faker'
import sinon from 'sinon'

import {
  Artifact,
  Environment,
  Page,
  Profile,
  Project,
  Setting,
  Snapshot,
  SnapshotReport,
  User,
} from '@perfsee/platform-server/db'
import { Redis } from '@perfsee/platform-server/redis'
import test, { create, createDBTestingModule, createMock, initTestDB } from '@perfsee/platform-server/test'
import { BundleJobPassedUpdate, BundleJobStatus } from '@perfsee/server-common'

import { ProjectService } from '../../project/service'
import { NotificationProviderFactory } from '../provider'
import { NotificationService } from '../service'
import { NotificationProvider } from '../type'

let notificationProviderStub: sinon.SinonStubbedInstance<NotificationProvider>
let project: Project
let projectSetting: Setting
let projectOwner: User

test.beforeEach(async (t) => {
  notificationProviderStub = createMock<NotificationProvider>()
  t.context.module = await createDBTestingModule({
    providers: [
      NotificationService,
      {
        provide: NotificationProviderFactory,
        useValue: {
          getProviders: () => ({
            testing: notificationProviderStub,
          }),
        },
      },
    ],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()

  projectOwner = await create(User)
  project = await create(Project)
  projectSetting = await Setting.create({
    project: project,
  }).save()

  t.context.module.get(Redis).exists.returns(Promise.resolve(false) as any)

  t.context.module.get(ProjectService).getProjectUsers.returns(Promise.resolve([projectOwner]))
})

test.serial('sendBundleJobNotification', async (t) => {
  const service = t.context.module.get(NotificationService)
  const result = createMock<BundleJobPassedUpdate>()

  const artifact = await create(Artifact, {
    project,
    status: BundleJobStatus.Passed,
    score: faker.datatype.number({ min: 1, max: 100 }),
  })

  await service.sendBundleJobNotification({ project, artifact, bundleJobResult: result, baselineArtifact: undefined })

  t.true(
    notificationProviderStub.sendBundleNotification.calledOnceWith(
      sinon.match({
        artifact,
        result,
        project: { id: project.id },
        projectSetting: { id: projectSetting.id },
        projectOwners: sinon.match.some(sinon.match({ id: projectOwner.id })),
      }),
    ),
  )
})

test.serial('sendLabJobNotification', async (t) => {
  const service = t.context.module.get(NotificationService)

  const snapshot = await create(Snapshot, {
    project,
    perfseeScanReport: {
      passed: 1,
      fail: 0,
      warning: 0,
      total: 1,
      time_cost: 1,
    },
  })
  const page = await create(Page, { projectId: project.id })
  const env = await create(Environment, { projectId: project.id })
  const profile = await create(Profile, { projectId: project.id })
  const snapshotReport = await create(SnapshotReport, {
    project,
    snapshot,
    page,
    env,
    profile,
  })

  await service.sendLabJobNotification({ snapshot, reports: [snapshotReport], project })

  t.true(
    notificationProviderStub.sendLabNotification.calledOnceWith(
      sinon.match({
        snapshot: { id: snapshot.id },
        reports: sinon.match.every(sinon.match({ id: snapshotReport.id })),
        project: { id: project.id },
        projectSetting: { id: projectSetting.id },
        projectOwners: sinon.match.every(sinon.match({ id: projectOwner.id })),
      }),
    ),
  )
})
