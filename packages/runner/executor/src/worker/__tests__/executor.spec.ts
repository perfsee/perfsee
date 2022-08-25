import { resolve } from 'path'

import ava, { TestFn } from 'ava'
import Sinon from 'sinon'

import { RunnerConfig } from '@perfsee/job-runner-shared'
import { JobInfo, JobType } from '@perfsee/server-common'

import { ConfigManager } from '../../config'
import { JobWorkerExecutor } from '../executor'

interface Context {
  executor: JobWorkerExecutor
  spies: {
    start: Sinon.SinonSpy
    update: Sinon.SinonSpy
    error: Sinon.SinonSpy
    end: Sinon.SinonSpy
    onMessage: Sinon.SinonSpy
  }
  tickWorker: (time: number) => Promise<void>
}

const test = ava as TestFn<Context>

const fakeJob: JobInfo<any> = {
  jobId: 0,
  jobType: JobType.All,
  payload: {},
}

function setup(job: Partial<JobInfo<any>>, config?: RunnerConfig): Context {
  const executor = new JobWorkerExecutor(
    resolve(__dirname, './test-worker-loader.js'),
    { ...fakeJob, ...job },
    config ?? new ConfigManager().load(),
  )

  const spies = {
    start: Sinon.spy(),
    update: Sinon.spy(),
    error: Sinon.spy(),
    end: Sinon.spy(),
  }

  executor.on('start', spies.start)
  executor.on('update', (update, done) => {
    spies.update(update)
    done()
  })
  executor.on('error', spies.error)
  executor.on('end', spies.end)
  // @ts-expect-error onMessage is private
  const onMessage = Sinon.spy(executor, 'onMessage')

  return {
    executor,
    spies: {
      ...spies,
      onMessage,
    },
    tickWorker: async (time) => {
      // @ts-expect-error
      executor.sendMessageToWorker('tick', time)
      // @ts-expect-error
      await executor.waitMessage('ticked')
    },
  }
}

test.beforeEach((t) => {
  t.context = setup(fakeJob)
})

test.serial('should be able to start and terminate worker', async (t) => {
  const { spies, executor } = t.context

  await t.notThrowsAsync(executor.start())
  t.assert(spies.start.calledOnce)

  await t.notThrowsAsync(executor.terminateWorker('canceled'))
  t.assert(spies.end.calledOnce)
})

test.serial('should finish worker correctly', async (t) => {
  const { executor, spies, tickWorker } = t.context
  await executor.start()
  await tickWorker(4000)
  t.assert(spies.end.calledOnce)
})

test.serial('should terminate if timeout', async (t) => {
  // fake timers in tests may affect each other
  // if they run parallely
  const timer = Sinon.useFakeTimers()
  const { executor, tickWorker } = setup({ timeout: 3 })
  const terminateSpy = Sinon.spy(executor, 'terminateWorker')

  await executor.start()
  timer.tick(3000)
  await tickWorker(1)

  t.assert(terminateSpy.calledOnceWith(`Timeout after 3 seconds.`))
  timer.restore()
})

test.serial('should batch job updates', async (t) => {
  const timer = Sinon.useFakeTimers({
    shouldAdvanceTime: true,
  })
  const { executor, spies, tickWorker } = t.context
  await executor.start()

  // wait for the first update call
  // 1) alive
  // 2) start
  // 3...n) log or update
  let timeElapsed = Date.now()
  await new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (spies.onMessage.callCount >= 2) {
        clearInterval(interval)
        resolve()
      }
    }, 100)
  })
  timeElapsed = Date.now() - timeElapsed
  // update interval is 3000ms
  const timeToFirstUpdate = 3000 - timeElapsed

  if (timeToFirstUpdate <= 0) {
    t.assert(spies.update.calledOnce)
    return
  }

  t.assert(spies.update.notCalled)

  await tickWorker(timeToFirstUpdate)
  timer.tick(timeToFirstUpdate)
  // the first update received, with only logs
  t.assert(spies.update.calledOnce)
  t.snapshot(spies.update.args[0], 'only logs')
  // after update is called, the queue now is empty

  // wait for the second update call
  await tickWorker(3000)
  timer.tick(3000)
  t.assert(spies.update.calledTwice)
  t.snapshot(spies.update.args[1], 'only logs as well')

  // last call, with `done` payload
  timer.tick(3000)
  t.assert(spies.update.calledThrice)
  t.assert(spies.update.args[2][0].done)

  timer.restore()
})
