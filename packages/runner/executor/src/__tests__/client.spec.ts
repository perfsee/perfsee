import ava, { TestFn } from 'ava'
import { merge } from 'lodash'
import { Response, ResponseInit, BodyInit, RequestInit } from 'node-fetch'
import Sinon from 'sinon'

import { PartialRunnerConfig, RunnerConfig } from '@perfsee/job-runner-shared'
import {
  JobRequestResponse,
  RegisterRunnerParams,
  RegisterRunnerResponse,
  UpdateJobTraceParams,
  UpdateJobTraceResponse,
} from '@perfsee/server-common'

import { PlatformClient } from '../platform-client'

interface RequestHandler {
  (url: string, request: RequestInit): Response
}

interface Context {
  client: PlatformClient
  useHandler: (handler: RequestHandler) => void
  useConfig: (config: PartialRunnerConfig) => void
}

const test = ava as TestFn<Context>

function fakeFetchResponse(body?: BodyInit, init?: ResponseInit) {
  return new Response(body, init)
}

function responseRegisterRunner(_url: string, request: RequestInit) {
  if (request.method !== 'POST') {
    return fakeFetchResponse(void 0, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const body = JSON.parse(request.body as string) as RegisterRunnerParams
  switch (body.token) {
    case 'test':
      return fakeFetchResponse(JSON.stringify({ token: 'valid' }), { status: 201 })
    case 'test-invalid':
      return fakeFetchResponse(JSON.stringify({ token: 'invalid' }), { status: 403 })
    default:
      return fakeFetchResponse(JSON.stringify({ token: 'unknown' }), { status: 400 })
  }
}

function responseVerifyRunner(_url: string, request: RequestInit) {
  if (request.method !== 'POST') {
    return fakeFetchResponse(void 0, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const token = request.headers!['x-runner-token']

  switch (token) {
    case 'valid':
      return fakeFetchResponse(void 0, { status: 204 })
    case 'invalid':
      return fakeFetchResponse(void 0, { status: 403 })
    default:
      return fakeFetchResponse(void 0, { status: 400 })
  }
}

function responseJobRequest(_url: string, request: RequestInit) {
  if (request.method !== 'POST') {
    return fakeFetchResponse(void 0, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const token = request.headers!['x-runner-token']

  switch (token) {
    case 'valid':
      return fakeFetchResponse(
        JSON.stringify({
          job: { jobId: 1 },
        } as JobRequestResponse),
        { status: 200 },
      )
    case 'no-job':
      return fakeFetchResponse(
        JSON.stringify({
          job: null,
        } as JobRequestResponse),
        { status: 200 },
      )
    case 'invalid':
      return fakeFetchResponse(void 0, { status: 403 })
    default:
      return fakeFetchResponse(void 0, { status: 400 })
  }
}

function responseUpdateJobTrace(_url: string, request: RequestInit) {
  if (request.method !== 'POST') {
    return fakeFetchResponse(void 0, {
      status: 404,
      statusText: 'Not Found',
    })
  }

  const body = JSON.parse(request.body as string) as UpdateJobTraceParams

  switch (body.jobId) {
    case 0:
      return fakeFetchResponse(JSON.stringify({ canceled: true }), { status: 202 })
    case 200:
    case 202:
      return fakeFetchResponse(JSON.stringify({ canceled: false }), { status: 202 })
    case 403:
      return fakeFetchResponse(void 0, { status: 403 })
    case 404:
      return fakeFetchResponse(void 0, { status: 404 })
    default:
      return fakeFetchResponse(void 0, { status: 400 })
  }
}

test.beforeEach((t) => {
  const config = { server: { token: 'valid' } } as RunnerConfig
  const client = new PlatformClient(config)

  const fetch = Sinon.stub(client, 'doFetch')
  t.context = {
    client,
    useConfig: (override: PartialRunnerConfig) => {
      merge(config, override)
    },
    useHandler: (handler: (url: string, request: RequestInit) => Response) => {
      fetch.callsFake((url, request) => Promise.resolve(handler(url, request!)))
    },
  }
})

test('register runner', async (t) => {
  const { client, useHandler } = t.context
  useHandler(responseRegisterRunner)

  let res: RegisterRunnerResponse | undefined

  res = await client.registerRunner('name', 'test')
  t.assert(res!.token === 'valid')
  res = await client.registerRunner('name', 'test-invalid')
  t.assert(!res)
  res = await client.registerRunner('name', 'other')
  t.assert(!res)
})

test('verify runner', async (t) => {
  const { client, useHandler, useConfig } = t.context
  useHandler(responseVerifyRunner)

  t.true(await client.verifyRunner())
  useConfig({ server: { token: 'invalid' } })
  t.false(await client.verifyRunner())
  useConfig({ server: { token: 'unknown' } })
  t.false(await client.verifyRunner())
})

test('request job', async (t) => {
  const { client, useHandler, useConfig } = t.context
  useHandler(responseJobRequest)

  let res: JobRequestResponse | undefined

  res = await client.requestJob()
  t.assert(res!.job!.jobId === 1)

  useConfig({ server: { token: 'no-job' } })
  res = await client.requestJob()
  t.assert(!res!.job)

  useConfig({ server: { token: 'invalid' } })
  res = await client.requestJob()
  t.assert(!res)

  useConfig({ server: { token: 'unknown' } })
  res = await client.requestJob()
  t.assert(!res)
})

test('update job trace', async (t) => {
  const { client, useHandler } = t.context
  useHandler(responseUpdateJobTrace)

  let res: UpdateJobTraceResponse | undefined
  res = await client.updateJobTrace({
    jobId: 0,
    trace: [],
  })
  t.assert(res!.canceled)

  res = await client.updateJobTrace({
    jobId: 200,
    trace: [],
  })
  t.assert(!res!.canceled)

  res = await client.updateJobTrace({
    jobId: 403,
    trace: [],
  })
  t.assert(!res)

  res = await client.updateJobTrace({
    jobId: 404,
    trace: [],
  })
  t.assert(!res)

  res = await client.updateJobTrace({
    jobId: 400,
    trace: [],
  })
  t.assert(!res)
})
