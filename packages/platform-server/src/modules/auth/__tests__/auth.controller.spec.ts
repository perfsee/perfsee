import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { omit } from 'lodash'
import request from 'supertest'

import { ConfigModule } from '@perfsee/platform-server/config'
import { User } from '@perfsee/platform-server/db'
import { CryptoService, UrlService } from '@perfsee/platform-server/helpers'
import test, { createMock } from '@perfsee/platform-server/test'

import { PerfseeSession } from '..'
import { ApplicationSettingService } from '../../application-setting'
import { EmailService } from '../../email/service'
import { UserService } from '../../user/service'
import { AuthController } from '../auth.controller'
import { AuthService } from '../auth.service'

let app: INestApplication
let session: PerfseeSession

const testuser = {
  username: 'tester',
  email: 'test@testing.com',
  password: 'fooooobar',
  firstName: 'first',
  lastName: 'last',
  isFulfilled: true,
}

test.beforeEach(async (t) => {
  t.context.module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot()],
    controllers: [AuthController],
    providers: [UrlService],
  })
    .useMocker(createMock)
    .compile()

  t.context.module.get(UserService).findUserByEmail.resolves(undefined)
  t.context.module.get(UserService).createUser.returnsArg(0)
  t.context.module.get(ApplicationSettingService).current.resolves(
    // @ts-expect-error partil type
    { enableSignup: true },
  )

  session = {} as PerfseeSession
  app = t.context.module.createNestApplication()
  app.use((req: any, _: any, next: any) => {
    req.session = session
    next()
  })
  await app.init()
})

test.serial('register', async (t) => {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      ...testuser,
    })
    .expect(302)
    .expect('Location', '/projects')

  t.true(t.context.module.get(UserService).createUser.calledWithMatch(omit(testuser, 'password', 'isFulfilled')))
  t.true(session.user.username === testuser.username)
})

test.serial('register - return url', async (t) => {
  await request(app.getHttpServer())
    .post('/auth/register?returnUrl=%2Ffoo%2Fbar')
    .send({
      ...testuser,
    })
    .expect(302)
    .expect('Location', '/foo/bar')

  t.pass()
})

test.serial('register - error input', async (t) => {
  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      ...testuser,
      email: '',
    })
    .expect(400)

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      ...testuser,
      username: '',
    })
    .expect(400)

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      ...testuser,
      password: '',
    })
    .expect(400)

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      ...testuser,
      username: 'a',
    })
    .expect(400)

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      ...testuser,
      password: '123',
    })
    .expect(400)

  t.falsy(session.user)
})

test.serial('register - user exists', async (t) => {
  t.context.module.get(UserService).findUserByEmail.resolves(testuser as User)

  await request(app.getHttpServer())
    .post('/auth/register')
    .send({
      ...testuser,
    })
    .expect(302)
    .expect('Location', '/register?statusCode=EMAIL_ALREADY_EXISTS')

  t.false(!!session.user)
})

test.serial('login', async (t) => {
  t.context.module.get(UserService).findUserByEmail.resolves(testuser as User)
  t.context.module.get(CryptoService).verifyPassword.returns(true)

  await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      username: testuser.username,
      password: testuser.password,
    })
    .expect(302)
    .expect('Location', '/projects')

  t.true(session.user.username === testuser.username)
})

test.serial('login - user not found', async (t) => {
  t.context.module.get(UserService).findUserByEmail.resolves(undefined)

  await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      username: testuser.username,
      password: testuser.password,
    })
    .expect(302)
    .expect('Location', '/login?statusCode=INVALID_PASSWORD')

  t.false(!!session.user)
})

test.serial('login - wrong password', async (t) => {
  t.context.module.get(UserService).findUserByEmail.resolves(testuser as User)
  t.context.module.get(CryptoService).verifyPassword.returns(false)

  await request(app.getHttpServer())
    .post('/auth/login')
    .send({
      username: testuser.username,
      password: testuser.password,
    })
    .expect(302)
    .expect('Location', '/login?statusCode=INVALID_PASSWORD')

  t.false(!!session.user)
})

test.serial('send reset password email', async (t) => {
  t.context.module.get(UserService).findUserByEmail.resolves(testuser as User)
  t.context.module.get(AuthService).generatePasswordResetToken.resolves('test-reset-password-token')

  await request(app.getHttpServer())
    .get('/auth/reset-password?returnUrl=%2Ffoo%2Fbar&email=' + encodeURIComponent(testuser.email))
    .expect(302)
    .expect('Location', '/foo/bar')

  const sendMailStub = t.context.module.get(EmailService).sendMail
  t.true(sendMailStub.calledOnce)
  t.deepEqual(sendMailStub.args[0][0].to, [testuser.email])
  t.true(sendMailStub.args[0][0].html.includes('test-reset-password-token'))
})

test.serial('send reset password email - empty email', async (t) => {
  await request(app.getHttpServer()).get('/auth/reset-password?returnUrl=%2Ffoo%2Fbar&email=').expect(400)

  t.pass()
})

test.serial('send reset password email - user not found', async (t) => {
  t.context.module.get(UserService).findUserByEmail.resolves(undefined)

  await request(app.getHttpServer())
    .get('/auth/reset-password?email=' + encodeURIComponent(testuser.email))
    .expect(400)

  t.pass()
})

test.serial('reset password', async (t) => {
  const validateAndDeletePasswordResetTokenStub = t.context.module.get(AuthService).validateAndDeletePasswordResetToken
  validateAndDeletePasswordResetTokenStub.resolves(testuser as User)
  t.context.module.get(CryptoService).encryptPassword.returns('encrypted-password')

  await request(app.getHttpServer())
    .post('/auth/reset-password?returnUrl=%2Ffoo%2Fbar')
    .send({ resetToken: 'test-reset-password-token', password: 'new-password', confirmPassword: 'new-password' })
    .expect(302)
    .expect('Location', '/foo/bar')

  t.true(validateAndDeletePasswordResetTokenStub.calledOnceWith('test-reset-password-token'))
  const updateUserPasswordStub = t.context.module.get(UserService).updateUserPassword
  t.true(updateUserPasswordStub.calledOnce)
  t.true(updateUserPasswordStub.args[0][0].username === testuser.username)
  t.true(updateUserPasswordStub.args[0][1] === 'encrypted-password')
})

test.serial('reset password - error input', async (t) => {
  await request(app.getHttpServer())
    .post('/auth/reset-password?returnUrl=%2Ffoo%2Fbar')
    .send({ resetToken: '', password: 'new-password', confirmPassword: 'new-password' })
    .expect(400)

  await request(app.getHttpServer())
    .post('/auth/reset-password?returnUrl=%2Ffoo%2Fbar')
    .send({ resetToken: 'test-reset-password-token', password: '', confirmPassword: '' })
    .expect(400)

  t.pass()
})

test.serial('logout', async (t) => {
  session.user = testuser as User

  await request(app.getHttpServer()).get('/auth/logout').expect(302).expect('Location', '/login')

  t.falsy(session.user)
})

test.serial('logout - return url', async (t) => {
  await request(app.getHttpServer())
    .get('/auth/logout?returnUrl=%2Ffoo%2Fbar')
    .expect(302)
    .expect('Location', '/foo/bar')

  t.pass()
})
