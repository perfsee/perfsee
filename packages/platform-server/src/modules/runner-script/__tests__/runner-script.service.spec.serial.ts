import { RunnerScript } from '@perfsee/platform-server/db'
import test, { createMock, initTestDB, createDBTestingModule } from '@perfsee/platform-server/test'
import { JobType } from '@perfsee/server-common'

import { RunnerScriptService } from '../service'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [RunnerScriptService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

const exampleScript = {
  version: '1.0.0',
  storageKey: 'test.tgz',
  sha256: '123456',
  size: 1,
  enable: true,
  jobType: JobType.LabAnalyze,
}

test.serial('create runner script', async (t) => {
  const service = t.context.module.get(RunnerScriptService)
  await service.create(exampleScript)

  const script = await RunnerScript.findOne({ where: { version: exampleScript.version } })
  t.assert(script)
})

test.serial('version already exists', async (t) => {
  const service = t.context.module.get(RunnerScriptService)
  await service.create(exampleScript)

  await t.throwsAsync(async () => {
    await service.create(exampleScript)
  })

  await t.notThrowsAsync(async () => {
    await service.create({ ...exampleScript, jobType: JobType.BundleAnalyze })
  })
})

test.serial('get activated version', async (t) => {
  const service = t.context.module.get(RunnerScriptService)
  await service.create(exampleScript)

  t.true((await service.getActivated(exampleScript.jobType))!.version === exampleScript.version)

  await service.create({ ...exampleScript, version: '1.0.1' })
  t.true((await service.getActivated(exampleScript.jobType))!.version === '1.0.1')

  await service.create({ ...exampleScript, version: '1.0.2', enable: false })
  t.true((await service.getActivated(exampleScript.jobType))!.version === '1.0.1')

  await service.create({ ...exampleScript, version: '1.0.2', jobType: JobType.SourceAnalyze, enable: false })
  t.true((await service.getActivated(exampleScript.jobType))!.version === '1.0.1')
})

test.serial('update runner script', async (t) => {
  const service = t.context.module.get(RunnerScriptService)
  await service.create(exampleScript)

  t.true((await RunnerScript.findOne({ where: { version: exampleScript.version } }))!.enable)

  await service.updateRunnerScripts(exampleScript.jobType, exampleScript.version, {
    enable: false,
  })
  t.false((await RunnerScript.findOne({ where: { version: exampleScript.version } }))!.enable)
})
