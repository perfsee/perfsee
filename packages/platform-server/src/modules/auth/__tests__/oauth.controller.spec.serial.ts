import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import qs from 'query-string'
import sinon from 'sinon'
import request from 'supertest'

import { ConfigModule, PerfseeConfig } from '@perfsee/platform-server/config'
import { User } from '@perfsee/platform-server/db'
import { UrlService } from '@perfsee/platform-server/helpers'
import test, { createMock } from '@perfsee/platform-server/test'
import { ExternalAccount } from '@perfsee/shared'

import { UserService } from '../..'
import { AuthService } from '../auth.service'
import { OAuth2Controller } from '../oauth.controller'
import { OAuthProvider, OAuthProviderFactory } from '../providers'
import { PerfseeSession } from '../type'

let app: INestApplication
let session: PerfseeSession
let oauthProviderStub: sinon.SinonStubbedInstance<OAuthProvider>

const githubUser = { username: 'github username', email: 'testing@test.com', avatarUrl: 'github-avatar.jpg' }
const newUser = {
  username: 'new-user',
  email: 'testing@test.com',
  avatarUrl: 'test-avatar.jpg',
  isFulfilled: true,
} as User
const nonFulfilledUser = {
  username: 'non-fulfilled-user',
  email: 'non-fulfilled-user@test.com',
  avatarUrl: 'test-avatar.jpg',
  isFulfilled: false,
} as User
const oauth2AuthUrl = 'http://localhost/auth'
const oauth2AccessCode = 'test-oauth2-code'
const oauth2AccessToken = 'test-token'
const testStateCode = 'test-state-code'
const testStateData = { provider: 'github', returnUrl: '/foo/bar' }

class FakeOAuthProvider extends OAuthProvider {
  protected globalConfig: PerfseeConfig = {} as any
  getAuthUrl() {
    return oauth2AuthUrl
  }
  async getToken() {
    return Promise.resolve(oauth2AccessToken)
  }
  async getUser() {
    return Promise.resolve(githubUser)
  }
}

test.beforeEach(async (t) => {
  t.context.module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot()],
    controllers: [OAuth2Controller],
    providers: [UrlService],
  })
    .useMocker(createMock)
    .compile()

  oauthProviderStub = sinon.stub(new FakeOAuthProvider() as OAuthProvider)
  t.context.module.get(OAuthProviderFactory).getProvider.returns(oauthProviderStub)

  const auth = t.context.module.get(AuthService)
  const user = t.context.module.get(UserService)

  // setup auth service
  t.context.module.get(AuthService).saveOauthState.returns(Promise.resolve(testStateCode))
  auth.getOauthState.callsFake((code) => Promise.resolve(code === testStateCode ? testStateData : null))
  auth.getUserFromRequest.returns(Promise.resolve(null))

  // setup oauth provider
  oauthProviderStub.getAuthUrl.returns(oauth2AuthUrl)
  oauthProviderStub.getToken.callsFake((code) =>
    code === oauth2AccessCode ? Promise.resolve(oauth2AccessToken) : Promise.reject(new Error('invalid code')),
  )
  oauthProviderStub.getUser.callsFake((token) =>
    token === oauth2AccessToken ? Promise.resolve(githubUser) : Promise.reject(new Error('invalid token')),
  )

  // setup user
  user.findUserByExternUsername.returns(Promise.resolve(null))
  user.findUserByEmail.returns(Promise.resolve(null))
  user.createUser.returns(Promise.resolve(newUser))

  session = {} as PerfseeSession
  app = t.context.module.createNestApplication()
  app.use((req: any, _: any, next: any) => {
    req.session = session
    next()
  })
  await app.init()
})

test.serial('oauth2 login', async (t) => {
  await request(app.getHttpServer()).get('/oauth2/login?provider=github').expect(302).expect('Location', oauth2AuthUrl)
  t.true(oauthProviderStub.getAuthUrl.args[0][0]?.includes(testStateCode))
})

test.serial('oauth2 login - error provider', async (t) => {
  t.context.module.get(OAuthProviderFactory).getProvider.returns(undefined)
  await request(app.getHttpServer()).get('/oauth2/login?provider=something').expect(400)

  t.pass()
})

test.serial('oauth2 vscode authorize', async (t) => {
  const auth = t.context.module.get(AuthService)
  auth.getUserFromRequest.returns(Promise.resolve({ id: 11, username: 'test' } as User))
  auth.generateToken.returns(Promise.resolve('test-token'))
  await request(app.getHttpServer())
    .get(
      '/oauth2/authorize?' +
        qs.stringify({
          clientId: 'perfsee-vscode',
          returnUrl: 'vscode://perfsee.perfsee-vscode/did-authenticate',
        }),
    )
    .expect(302)
    .expect('Location', 'vscode://perfsee.perfsee-vscode/did-authenticate?token=test-token')

  t.pass()
})

test.serial('oauth2 vscode authorize - error input', async (t) => {
  await request(app.getHttpServer())
    .get(
      '/oauth2/authorize?' +
        qs.stringify({
          clientId: 'some-else',
          returnUrl: 'vscode://perfsee.perfsee-vscode/did-authenticate',
        }),
    )
    .expect(401)

  await request(app.getHttpServer())
    .get('/oauth2/authorize?' + qs.stringify({ clientId: 'perfsee-vscode', returnUrl: 'some-else-url' }))
    .expect(401)

  t.pass()
})

test.serial('oauth2 vscode authorize - no login', async (t) => {
  t.context.module.get(AuthService).getUserFromRequest.returns(Promise.resolve(null))
  await request(app.getHttpServer())
    .get(
      '/oauth2/authorize?' +
        qs.stringify({
          clientId: 'perfsee-vscode',
          returnUrl: 'vscode://perfsee.perfsee-vscode/did-authenticate',
        }),
    )
    .expect(302)
    .expect('Location', /\/login.*/)

  t.pass()
})

test.serial('oauth2 callback - no user logged in, email and external account has not been registered', async (t) => {
  const user = t.context.module.get(UserService)

  await request(app.getHttpServer())
    .get(
      '/oauth2/callback?' + qs.stringify({ code: oauth2AccessCode, state: JSON.stringify({ state: testStateCode }) }),
    )
    .expect(302)
    .expect('Location', testStateData.returnUrl)

  t.true(user.createUser.calledOnceWith(githubUser), 'should create new user with github user information')
  t.true(
    user.connectAccount.calledOnceWith(newUser, ExternalAccount.github, githubUser.username, oauth2AccessToken),
    'should connect the new account to given github account',
  )
  t.deepEqual(session.user, newUser, 'should save user to session')
})

test.serial('oauth2 callback - user logged in, should connect external account to user', async (t) => {
  // mock environment, user logged in
  const user = t.context.module.get(UserService)
  const auth = t.context.module.get(AuthService)
  auth.getUserFromRequest.returns(Promise.resolve(newUser))

  await request(app.getHttpServer())
    .get(
      '/oauth2/callback?' + qs.stringify({ code: oauth2AccessCode, state: JSON.stringify({ state: testStateCode }) }),
    )
    .expect(302)
    .expect('Location', testStateData.returnUrl)

  t.false(user.createUser.called)
  t.true(
    user.connectAccount.calledOnceWith(newUser, ExternalAccount.github, githubUser.username, oauth2AccessToken),
    'should connect to given github account',
  )
})

test.serial(
  'oauth2 callback - user logged in and connected to given github account, should return directly',
  async (t) => {
    // mock environment, user logged in
    const user = t.context.module.get(UserService)
    const auth = t.context.module.get(AuthService)
    auth.getUserFromRequest.returns(Promise.resolve(newUser))
    user.findUserByExternUsername.callsFake((account, username) =>
      Promise.resolve(account === ExternalAccount.github && username === githubUser.username ? newUser : null),
    )

    await request(app.getHttpServer())
      .get(
        '/oauth2/callback?' + qs.stringify({ code: oauth2AccessCode, state: JSON.stringify({ state: testStateCode }) }),
      )
      .expect(302)
      .expect('Location', testStateData.returnUrl)

    t.false(user.createUser.called)
    t.false(user.connectAccount.called)
  },
)

test.serial(
  'oauth2 callback - email already exists and connected to given github account, should login directly',
  async (t) => {
    // mock environment, email already exists and connected to given github account
    const user = t.context.module.get(UserService)
    user.findUserByEmail.callsFake((email) => Promise.resolve(email === newUser.email ? newUser : null))
    user.findUserByExternUsername.callsFake((account, username) =>
      Promise.resolve(account === ExternalAccount.github && username === githubUser.username ? newUser : null),
    )

    await request(app.getHttpServer())
      .get(
        '/oauth2/callback?' + qs.stringify({ code: oauth2AccessCode, state: JSON.stringify({ state: testStateCode }) }),
      )
      .expect(302)
      .expect('Location', testStateData.returnUrl)

    t.false(user.createUser.called)
    t.false(user.connectAccount.called)
    t.deepEqual(session.user, newUser, 'should save user to session')
  },
)

test.serial(
  'oauth2 callback - email already exists and not connected to given github account, should redirect to error page',
  async (t) => {
    // mock environment, email already exists and already connected to given github account
    const user = t.context.module.get(UserService)
    user.findUserByEmail.callsFake((email) => Promise.resolve(email === newUser.email ? newUser : null))
    user.getUserConnectedAccount.returns(Promise.resolve(null))

    await request(app.getHttpServer())
      .get(
        '/oauth2/callback?' + qs.stringify({ code: oauth2AccessCode, state: JSON.stringify({ state: testStateCode }) }),
      )
      .expect(302)
      .expect('Location', /\/login.*statusCode=EMAIL_ALREADY_EXISTS.*/)

    t.false(user.createUser.called)
    t.false(user.connectAccount.called)
    t.falsy(session.user)
  },
)

test.serial('oauth2 callback - email already exists but not fulfilled, should connect user', async (t) => {
  const user = t.context.module.get(UserService)
  oauthProviderStub.getUser.resolves(
    /* @ts-expect-error type is ok */
    nonFulfilledUser,
  )
  user.findUserByEmail.resolves(nonFulfilledUser)

  await request(app.getHttpServer())
    .get(
      '/oauth2/callback?' + qs.stringify({ code: oauth2AccessCode, state: JSON.stringify({ state: testStateCode }) }),
    )
    .expect(302)
    .expect('Location', testStateData.returnUrl)

  t.true(user.createUser.notCalled)
  t.true(user.connectAccount.called)
})
