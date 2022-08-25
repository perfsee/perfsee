import ava, { TestFn } from 'ava'
import Sinon from 'sinon'

import { JobType } from '@perfsee/server-common'

import { AbstractJobLogger } from '../logger'

import { FakeWorker } from './test-worker'

interface Context {
  worker: FakeWorker
  logger: Sinon.SinonStubbedInstance<AbstractJobLogger>
  msgFunc: Sinon.SinonStub
}

const test = ava as TestFn<Context>

test.beforeEach((t) => {
  const mockLogger = Sinon.stub({
    info: () => {},
    verbose: () => {},
    error: () => {},
    warn: () => {},
  })

  class FFakeWorker extends FakeWorker {
    get logger() {
      return mockLogger as any
    }
  }

  const worker = new FFakeWorker({
    job: { jobId: 0, jobType: JobType.All, payload: {} },
    // @ts-expect-error we don't test it here
    server: {},
  })

  // we aren't testing stuff in real sub processes, so we can just stub it
  // @ts-expect-error private
  const msg = Sinon.stub(worker, 'postMessage')

  t.context = {
    worker,
    // @ts-expect-error allowed
    logger: mockLogger,
    msgFunc: msg,
  }
})

test('should run worker to the end', async (t) => {
  const { worker, logger, msgFunc } = t.context
  const timer = Sinon.useFakeTimers()
  const task = t.notThrowsAsync(worker.run())
  await timer.nextAsync()
  await task

  t.assert(logger.info.calledWith('FakeWorker:before'))
  t.assert(logger.info.calledWith('FakeWorker:work'))
  t.assert(logger.info.calledWith('FakeWorker:after'))
  t.assert(msgFunc.calledWith('end', undefined))
})

test('should never throw', async (t) => {
  const { worker, logger } = t.context
  Sinon.stub(worker, 'doWork').throws(new Error('FakeError'))
  await t.notThrowsAsync(worker.run())
  t.assert(logger.error.calledWith('Error occurred during job run'))
})
