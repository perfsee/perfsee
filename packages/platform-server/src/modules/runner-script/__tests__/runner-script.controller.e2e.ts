import { createHash } from 'crypto'

import { HttpStatus } from '@nestjs/common'
import request from 'supertest'

import test, { initTestDB } from '@perfsee/platform-server/test'
import { RegisterRunnerParams } from '@perfsee/server-common'

const registrationToken = 'registrationToken'
let runnerToken = ''
test.before(async () => {
  await initTestDB()
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

  const res = await request(perfsee.baseUrl).post('/api/runners/register').send(params)
  runnerToken = res.body.token
})

test.serial('create runner script', async (t) => {
  const buffer = Buffer.from('test')
  const checksum = createHash('sha256').update(buffer).digest('base64')

  {
    const res = await request(perfsee.baseUrl)
      .post(`/api/runners/scripts/LabAnalyze/1.0.0?enable=true`)
      .set('x-registration-token', registrationToken)
      .set('x-checksum', checksum)
      .set('content-type', 'application/octet-stream')
      .send(buffer)

    t.is(res.statusCode, HttpStatus.CREATED)
  }

  // Failed to validate script checksum
  {
    const res = await request(perfsee.baseUrl)
      .post(`/api/runners/scripts/LabAnalyze/1.0.0?enable=true`)
      .set('x-registration-token', registrationToken)
      .set('x-checksum', '123')
      .set('content-type', 'application/octet-stream')
      .send(buffer)

    t.is(res.statusCode, HttpStatus.FORBIDDEN)
    t.is(res.body.message, 'Failed to validate script checksum')
  }

  {
    const res = await request(perfsee.baseUrl)
      .get('/api/runners/scripts/LabAnalyze/activated')
      .set('x-runner-token', runnerToken)
      .send()

    t.is(res.statusCode, HttpStatus.OK)
    t.is(res.body.version, '1.0.0')
    t.deepEqual(res.body.sha256, checksum)
  }

  {
    const res = await request(perfsee.baseUrl)
      .get('/api/runners/scripts/LabAnalyze/1.0.0/download')
      .set('x-runner-token', runnerToken)
      .buffer()
      .parse((res, cb) => {
        res.setEncoding('binary')
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => {
          cb(null, Buffer.from(data, 'binary'))
        })
      })
      .send()

    t.is(res.statusCode, HttpStatus.OK)
    t.deepEqual(res.body, buffer)
  }
})
