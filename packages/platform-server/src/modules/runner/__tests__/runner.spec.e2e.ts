import { HttpStatus } from '@nestjs/common'
import test from 'ava'
import request from 'supertest'

import { initTestDB } from '@perfsee/platform-server/test'
import { RegisterRunnerParams } from '@perfsee/server-common'

test.before(async () => {
  await initTestDB()
})

test('should be able to register runner', async (t) => {
  const params: RegisterRunnerParams = {
    token: 'registrationToken',
    info: {
      name: 'test runner',
      version: '1.0.0',
      nodeVersion: '10.0.0',
      platform: 'linux',
      arch: 'x64',
      zone: 'cn',
    },
  }

  const res = await request(perfsee.baseUrl).post('/api/runners/register').send(params)

  t.is(res.statusCode, HttpStatus.CREATED)
  t.truthy(res.body.token)

  const verify = await request(perfsee.baseUrl).post('/api/runners/verify').set('x-runner-token', res.body.token).send()
  t.is(verify.statusCode, HttpStatus.NO_CONTENT)
})

test('should forbid unauthorized registration token', async (t) => {
  const params: RegisterRunnerParams = {
    token: 'invalid token',
    info: {
      name: 'test runner',
      version: '1.0.0',
      nodeVersion: '10.0.0',
      platform: 'linux',
      arch: 'x64',
      zone: 'cn',
    },
  }

  const res = await request(perfsee.baseUrl).post('/api/runners/register').send(params)

  t.is(res.statusCode, HttpStatus.FORBIDDEN)
})
