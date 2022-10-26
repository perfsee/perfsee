import { Test } from '@nestjs/testing'
import test from 'ava'
import { Response } from 'express'
import sinon from 'sinon'

import { ConfigModule } from '@perfsee/platform-server/config'
import { pathFactory } from '@perfsee/shared/routes'

import { UrlService } from '..'

let service: UrlService

test.before(async () => {
  const module = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ https: true, host: 'perfsee.com' })],
    providers: [UrlService],
  }).compile()

  service = module.get(UrlService)
})

test('should generate correct platform url', (t) => {
  t.is(
    service.projectUrl(pathFactory.project.home, {
      projectId: 'test-project',
    }),
    'https://perfsee.com/projects/test-project/home',
  )

  t.is(
    service.projectUrl(pathFactory.project.home, {
      projectId: 'test-project',
    }),
    'https://perfsee.com/projects/test-project/home',
  )

  t.is(
    service.projectUrl(pathFactory.project.bundle.detail, {
      projectId: 'test-project',
      bundleId: 1,
    }),
    'https://perfsee.com/projects/test-project/bundle/1',
  )
})

test('safe redirect', async (t) => {
  const fakeRedirect = sinon.fake()
  const fakeResponse = { redirect: fakeRedirect } as unknown as Response

  service.safeRedirect(fakeResponse, '')
  t.true(fakeRedirect.calledWith('/'))

  service.safeRedirect(fakeResponse, '/test')
  t.true(fakeRedirect.calledWith('/test'))

  service.safeRedirect(fakeResponse, '/test?abc=def')
  t.true(fakeRedirect.calledWith('/test?abc=def'))

  service.safeRedirect(fakeResponse, 'https://www.google.com')
  t.true(fakeRedirect.calledWith('/'))

  service.safeRedirect(fakeResponse, 'https://perfsee.com/login')
  t.true(fakeRedirect.calledWith('/login'))

  service.safeRedirect(fakeResponse, '../login')
  t.true(fakeRedirect.calledWith('/login'))

  service.safeRedirect(fakeResponse, '/login/../abc')
  t.true(fakeRedirect.calledWith('/abc'))

  service.safeRedirect(fakeResponse, 'back')
  t.true(fakeRedirect.calledWith('/'))

  // test subpath host
  {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ https: true, host: 'perfsee.com', path: '/example' })],
      providers: [UrlService],
    }).compile()

    const service = module.get(UrlService)

    service.safeRedirect(fakeResponse, '')
    t.true(fakeRedirect.calledWith('/example'))

    service.safeRedirect(fakeResponse, '/')
    t.true(fakeRedirect.calledWith('/example'))

    service.safeRedirect(fakeResponse, '/example/test')
    t.true(fakeRedirect.calledWith('/example/test'))

    service.safeRedirect(fakeResponse, 'https://perfsee.com/example/login')
    t.true(fakeRedirect.calledWith('/example/login'))

    service.safeRedirect(fakeResponse, 'https://perfsee.com/abc')
    t.true(fakeRedirect.calledWith('/example'))

    service.safeRedirect(fakeResponse, '../test')
    t.true(fakeRedirect.calledWith('/example'))
  }
})
