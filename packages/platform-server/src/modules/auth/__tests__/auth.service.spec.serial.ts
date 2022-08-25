import { isMatch } from 'lodash'

import { ConfigModule } from '@perfsee/platform-server/config'
import { User } from '@perfsee/platform-server/db'
import { HelpersModule } from '@perfsee/platform-server/helpers'
import { RedisModule } from '@perfsee/platform-server/redis'
import test, { createMock, initTestDB, create, createDBTestingModule } from '@perfsee/platform-server/test'

import { AuthService } from '../auth.service'

test.beforeEach(async (t) => {
  t.context.module = await createDBTestingModule({
    imports: [RedisModule, ConfigModule.forRoot(), HelpersModule],
    controllers: [AuthService],
  })
    .useMocker(createMock)
    .compile()

  await initTestDB()
})

test.serial('oauth state', async (t) => {
  const auth = t.context.module.get(AuthService)
  const state = await auth.saveOauthState({ foo: 'bar' })
  t.deepEqual(await auth.getOauthState(state), { foo: 'bar' })
  t.deepEqual(await auth.getOauthState('test'), null)
})

test.serial('password reset token', async (t) => {
  const user = await create(User)

  const auth = t.context.module.get(AuthService)
  const resetToken = await auth.generatePasswordResetToken(user)
  t.deepEqual((await auth.validateAndDeletePasswordResetToken(resetToken))?.id, user.id)
})

test.serial('user access token', async (t) => {
  const user = await create(User)

  const auth = t.context.module.get(AuthService)
  const token = await auth.generateToken(user, 'test-token')
  t.true(isMatch(await auth.getAllTokenRecords(user), [{ userId: user.id, name: 'test-token' }]))
  t.deepEqual(
    (await auth.getUserFromRequest({ session: {}, headers: { authorization: 'Bearer ' + token } } as any))?.id,
    user.id,
  )

  await auth.invalidToken(user, 'test-token')
  t.deepEqual(await auth.getAllTokenRecords(user), [])
  t.deepEqual(
    await auth.getUserFromRequest({ session: {}, headers: { authorization: 'Bearer ' + token } } as any),
    null,
  )
})

test.serial('get user from request', async (t) => {
  const user = await create(User)

  const auth = t.context.module.get(AuthService)
  t.deepEqual(await auth.getUserFromRequest({ session: {}, headers: {} } as any), null)
  t.deepEqual(await auth.getUserFromRequest({ user, session: {}, headers: {} } as any), user)
  t.deepEqual(await auth.getUserFromRequest({ session: { user }, headers: {} } as any), user)
})
