import { faker } from '@faker-js/faker'

import { Environment } from '@perfsee/platform-server/db'
import { InternalIdService } from '@perfsee/platform-server/helpers'
import test, { createMock, initTestDB, createDBTestingModule, create } from '@perfsee/platform-server/test'

import { SnapshotReportService } from '../../snapshot/snapshot-report/service'
import { EnvironmentService } from '../service'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [EnvironmentService, SnapshotReportService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

test.serial('get environment by iid', async (t) => {
  const created = await create(Environment)

  const service = t.context.module.get(EnvironmentService)
  const environment = await service.getEnvironment(created.projectId, created.iid)

  t.is(environment.id, created.id)
  t.is(environment.name, created.name)
})

test.serial('get environments', async (t) => {
  const projectId = 1
  await create(Environment, { projectId, disable: true })
  await create(Environment, { projectId })

  const service = t.context.module.get(EnvironmentService)
  const environments = await service.getEnvironments(1)

  t.is(environments.length, 2)
  t.true(environments[0].disable)
})

test.serial('create environment', async (t) => {
  const projectId = 1
  const service = t.context.module.get(EnvironmentService)
  const internalIdService = t.context.module.get(InternalIdService)
  internalIdService.generate.resolves(1)

  const payload = {
    name: faker.word.noun(),
  }

  const environment = await service.updateEnvironment(projectId, payload)

  t.truthy(environment.id)
  t.is(environment.name, payload.name)
  t.is(environment.iid, 1)
  t.false(environment.disable)
})

test.serial('create environment with same name', async (t) => {
  const projectId = 1
  const service = t.context.module.get(EnvironmentService)

  const name = faker.word.noun()
  await create(Environment, { name, projectId })

  const payload = {
    name,
  }

  await t.throwsAsync(
    async () => {
      await service.updateEnvironment(projectId, payload)
    },
    { instanceOf: Error, message: `[User Error] environment with name ${name} exists.` },
  )
})

test.serial('update environment', async (t) => {
  const projectId = 1
  const environment = await create(Environment, { projectId })
  const service = t.context.module.get(EnvironmentService)

  const payload = {
    name: faker.word.noun(),
    iid: environment.iid,
    headers: [{ key: 'foo', value: 'foo', host: faker.internet.domainName() }],
  }

  const updated = await service.updateEnvironment(projectId, payload)

  t.is(payload.name, updated.name)
  t.deepEqual(payload.headers, updated.headers)
})
