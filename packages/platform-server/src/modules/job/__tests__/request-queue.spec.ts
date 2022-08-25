import test from 'ava'
import Sinon, { SinonFakeTimers } from 'sinon'

import { RequestQueue } from '../request-queue'

let timer: SinonFakeTimers
test.before(() => {
  timer = Sinon.useFakeTimers()
})

test.after(() => {
  timer.restore()
})

test('should be able to acquire queue successfully', async (t) => {
  const queue = new RequestQueue(1, 1, 3000)
  await t.notThrowsAsync(queue.acquire(), 'queue acquired')
})

test('should throw when unable to acquire queue', async (t) => {
  const queue = new RequestQueue(1, 1, 3000)
  await queue.acquire()
  const timeoutAcquisition = queue.acquire()
  const limitedAcquisition = queue.acquire()
  await t.throwsAsync(limitedAcquisition, { message: 'Too many requests' })

  timer.tick(3000)
  await t.throwsAsync(timeoutAcquisition, { message: 'Timeout' })
})

test('should be accepted when previous request dequeued', async (t) => {
  const queue = new RequestQueue(1, 1, 3000)
  await queue.acquire()
  const acquirePromise = queue.acquire()
  timer.tick(1000)
  queue.release()
  timer.tick(1000)

  await t.notThrowsAsync(acquirePromise)
})

test('should evaluate callback correctly', async (t) => {
  const queue = new RequestQueue(1, 1, 3000)

  const count = await queue.enqueue(() => {
    return Promise.resolve(1)
  })

  t.is(count, 1)

  const e = new Error('test error')
  await t.throwsAsync(
    queue.enqueue(() => {
      throw e
    }),
    { is: e },
  )
})
