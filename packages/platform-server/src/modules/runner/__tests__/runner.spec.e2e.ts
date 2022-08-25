import { HttpStatus } from '@nestjs/common'
import test from 'ava'
import config from 'config'
import request from 'supertest'

import { ApplicationSetting } from '@perfsee/platform-server/db'
import { initTestDB } from '@perfsee/platform-server/test'
import { RegisterRunnerParams } from '@perfsee/server-common'

test.before(async () => {
  await initTestDB()
})

test('should be able to register runner', async (t) => {
  const registrationToken = 'registrationToken'
  await ApplicationSetting.create({
    registrationToken,
  }).save()

  const params: RegisterRunnerParams = {
    token: registrationToken,
    info: {
      name: 'test runner',
      version: '1.0.0',
      nodeVersion: '10.0.0',
      platform: 'linux',
      arch: 'x64',
      zone: 'cn',
    },
  }

  const res = await request(config.host).post('/api/runners/register').send(params)

  t.is(res.statusCode, HttpStatus.CREATED)
  t.truthy(res.body.token)

  const verify = await request(config.host).post('/api/runners/verify').set('x-runner-token', res.body.token).send()
  t.is(verify.statusCode, HttpStatus.NO_CONTENT)
})
