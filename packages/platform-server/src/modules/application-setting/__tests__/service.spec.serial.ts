import Sinon from 'sinon'

import { Config, ConfigModule } from '@perfsee/platform-server/config'
import { Redis } from '@perfsee/platform-server/redis'
import test, { createDBTestingModule, createMock } from '@perfsee/platform-server/test'

import { ApplicationSettingService } from '../service'

let service: ApplicationSettingService
test.before(async (t) => {
  t.context.module = await createDBTestingModule({
    providers: [ApplicationSettingService],
    imports: [
      ConfigModule.forRoot({
        runner: {
          validateRegistrationToken: true,
        },
      }),
    ],
  })
    .useMocker(createMock)
    .compile()

  service = t.context.module.get(ApplicationSettingService)
})

test.serial('should create default settings after application bootstrapped', async (t) => {
  const settings = await service.currentWithoutCache()

  t.assert(settings)
  t.is(settings.id, 1)
})

test.serial('should never create setting entity more then once', async (t) => {
  // @ts-expect-error private method
  const settings = await service.createFromDefaults()
  // @ts-expect-error private method
  const settings2 = await service.createFromDefaults()

  t.deepEqual(settings, settings2)
})

test.serial('should fast return if cache found', async (t) => {
  const redis = t.context.module.get(Redis)
  redis.get.resolves(JSON.stringify({ id: 1, registrationToken: 'cache' }))

  const settings = await service.current()
  t.is(settings.registrationToken, 'cache')

  redis.get.resolves(null)
})

test.serial('should save setting patches correctly', async (t) => {
  const settings = await service.current()
  settings.registrationToken = 'new'
  let newSettings = await service.save(settings)

  t.is(newSettings.registrationToken, 'new')

  newSettings = await service.update({
    registrationToken: 'new2',
  })

  t.is(newSettings.registrationToken, 'new2')
})

test.serial('should handle registration token correctly', async (t) => {
  const token = (await service.current()).registrationToken
  t.true(await service.validateRegistrationToken(token))
  t.false(await service.validateRegistrationToken('invalid'))

  Sinon.stub(
    service,
    // @ts-expect-error private method
    'generateNewRegistrationToken',
  ).returns(
    // @ts-expect-error
    'new',
  )

  await service.resetRegistrationToken()

  t.false(await service.validateRegistrationToken(token))
  t.true(await service.validateRegistrationToken('new'))

  const config = t.context.module.get(Config)
  config.runner.validateRegistrationToken = false

  t.true(await service.validateRegistrationToken('invalid'))
})
