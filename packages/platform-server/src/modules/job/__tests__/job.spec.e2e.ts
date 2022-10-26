import { HttpStatus } from '@nestjs/common'
import request from 'supertest'

import { Artifact, Job, JobStatus, Runner } from '@perfsee/platform-server/db'
import test, { create, initTestDB } from '@perfsee/platform-server/test'
import { JobRequestResponse, JobType, UpdateJobTraceParams } from '@perfsee/server-common'

let runner: Runner
test.before(async () => {
  await initTestDB()
  runner = await create(Runner)
})

test('should return pending job when job requested', async (t) => {
  const artifact = await create(Artifact, {
    buildKey: 'test-build-key.tar',
  })
  const job = await create(Job, { jobType: JobType.BundleAnalyze, entityId: artifact.id })

  const res = await request(perfsee.baseUrl).post('/api/jobs/request').set('x-runner-token', runner.token).send({})

  const jobRes = (res.body as JobRequestResponse).job
  t.assert(res.ok)
  t.is(res.statusCode, HttpStatus.OK)
  t.is(jobRes!.jobId, job.id)
  t.snapshot(jobRes)
})

test('should forbid invalid runner token for requesting job', async (t) => {
  const res = await request(perfsee.baseUrl).post('/api/jobs/request').set('x-runner-token', 'invalid token').send({})

  t.is(res.statusCode, HttpStatus.FORBIDDEN)
})

test('should still return even no pending job', async (t) => {
  const runner = await create(Runner, {
    jobType: JobType.LabAnalyze,
  })
  const res = await request(perfsee.baseUrl).post('/api/jobs/request').set('x-runner-token', runner.token).send({})

  t.is(res.statusCode, HttpStatus.OK)
  t.falsy(res.body.job)
})

test('should not assign job if runner is inactivated', async (t) => {
  const runner = await create(Runner, {
    active: false,
  })

  const res = await request(perfsee.baseUrl).post('/api/jobs/request').set('x-runner-token', runner.token).send({})

  t.is(res.statusCode, HttpStatus.OK)
  t.falsy(res.body.job)
})

test('should successfully update trace', async (t) => {
  const job = await create(Job, { runner })
  const res = await request(perfsee.baseUrl)
    .post('/api/jobs/trace')
    .set('x-runner-token', runner.token)
    .send({
      jobId: job.id,
      trace: [],
    } as UpdateJobTraceParams)

  t.is(res.statusCode, HttpStatus.ACCEPTED)
  t.snapshot(res.body)
})

test('should return canceled status if job canceled', async (t) => {
  const job = await create(Job, { status: JobStatus.Canceled, runner })
  const res = await request(perfsee.baseUrl)
    .post('/api/jobs/trace')
    .set('x-runner-token', runner.token)
    .send({
      jobId: job.id,
      trace: [],
    } as UpdateJobTraceParams)

  t.is(res.statusCode, HttpStatus.ACCEPTED)
  t.snapshot(res.body)
})

test('should forbid invalid runner', async (t) => {
  const res = await request(perfsee.baseUrl)
    .post('/api/jobs/trace')
    .set('x-runner-token', 'invalid token')
    .send({
      jobId: 1,
      trace: [],
    } as UpdateJobTraceParams)

  t.is(res.statusCode, HttpStatus.FORBIDDEN)
})

test('should forbid non-assigned runner', async (t) => {
  const job = await create(Job, { runner })
  const otherRunner = await create(Runner)
  const res = await request(perfsee.baseUrl)
    .post('/api/jobs/trace')
    .set('x-runner-token', otherRunner.token)
    .send({
      jobId: job.id,
      trace: [],
    } as UpdateJobTraceParams)

  t.is(res.statusCode, HttpStatus.FORBIDDEN)
})

test('should return 404 if job not found', async (t) => {
  const res = await request(perfsee.baseUrl)
    .post('/api/jobs/trace')
    .set('x-runner-token', runner.token)
    .send({
      jobId: 0,
      trace: [],
    } as UpdateJobTraceParams)

  t.is(res.statusCode, HttpStatus.NOT_FOUND)
})

test('upload and download artifact', async (t) => {
  const filename = 'test.txt'

  const job = await create(Job, { status: JobStatus.Running, runner })

  const upload = await request(perfsee.baseUrl)
    .post('/api/jobs/artifacts')
    .query({ key: filename, jobId: job.id })
    .set('x-runner-token', runner.token)
    .set('content-type', 'application/octet-stream')
    .send(Buffer.from('content'))

  t.is(upload.statusCode, HttpStatus.CREATED)

  const { key } = upload.body
  t.truthy(key)

  const download = await request(perfsee.baseUrl)
    .get('/api/jobs/artifacts')
    .query({ key })
    .set('x-runner-token', runner.token)

  t.is(download.statusCode, HttpStatus.OK)
  t.is(download.text, 'content')
})

test('should forbid invalid runner upload & download artifact', async (t) => {
  const key = 'test.txt'

  const job = await create(Job, { status: JobStatus.Running, runner })

  const upload = await request(perfsee.baseUrl)
    .post('/api/jobs/artifacts')
    .query({ key, jobId: job.id })
    .set('x-runner-token', 'invalid token')
    .set('content-type', 'application/octet-stream')
    .send(Buffer.from('content'))

  t.is(upload.statusCode, HttpStatus.FORBIDDEN)

  const download = await request(perfsee.baseUrl)
    .get('/api/jobs/artifacts')
    .query({ key })
    .set('x-runner-token', 'invalid token')

  t.is(download.statusCode, HttpStatus.FORBIDDEN)
})

test('should forbid invalid jobId', async (t) => {
  const key = 'test.txt'

  const upload = await request(perfsee.baseUrl)
    .post('/api/jobs/artifacts')
    .query({ key, jobId: 'not-number' })
    .set('x-runner-token', runner.token)
    .set('content-type', 'application/octet-stream')
    .send(Buffer.from('content'))

  t.is(upload.statusCode, HttpStatus.FORBIDDEN)

  const upload2 = await request(perfsee.baseUrl)
    .post('/api/jobs/artifacts')
    .query({ key, jobId: '123456' })
    .set('x-runner-token', runner.token)
    .set('content-type', 'application/octet-stream')
    .send(Buffer.from('content'))

  t.is(upload2.statusCode, HttpStatus.NOT_FOUND)
})

test('should return 403 if jobId and runner do not match', async (t) => {
  const key = 'test.txt'

  const otherRunner = await create(Runner)
  const job = await create(Job, { status: JobStatus.Running, runner: otherRunner })

  const upload = await request(perfsee.baseUrl)
    .post('/api/jobs/artifacts')
    .query({ key, jobId: job.id })
    .set('x-runner-token', runner.token)
    .set('content-type', 'application/octet-stream')
    .send(Buffer.from('content'))

  t.is(upload.statusCode, HttpStatus.FORBIDDEN)
})

test('should return 404 if no artifact found', async (t) => {
  const download = await request(perfsee.baseUrl)
    .get('/api/jobs/artifacts')
    .query({ key: 'not-found.txt' })
    .set('x-runner-token', runner.token)

  t.is(download.statusCode, HttpStatus.NOT_FOUND)
})
