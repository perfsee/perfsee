import test from 'ava'

import { InternalIdUsage } from '@perfsee/platform-server/db'
import { createDBTestingModule, initTestDB } from '@perfsee/platform-server/test'

import { InternalIdService } from '../service'

test.beforeEach(async () => {
  await initTestDB()
})

let service: InternalIdService

test.before(async () => {
  const testModule = await createDBTestingModule({
    providers: [InternalIdService],
  }).compile()

  service = testModule.get<InternalIdService>(InternalIdService)
})

test('should generate correct internal id', async (t) => {
  const id1 = await service.generate(1, InternalIdUsage.Env)
  const id2 = await service.generate(1, InternalIdUsage.Page)

  t.is(id1, 1)
  t.is(id2, 1)
})

test('should deal with concurrency correctly', async (t) => {
  const ids = await Promise.all(new Array(10).fill(0).map(() => service.generate(1, InternalIdUsage.Env)))

  t.deepEqual(
    ids.sort((a, b) => a - b),
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  )
})

test('should be able to reset internal id', async (t) => {
  const id1 = await service.generate(1, InternalIdUsage.Env)

  t.is(await service.reset(1, InternalIdUsage.Env, 2), false)
  t.is(await service.reset(1, InternalIdUsage.Env, id1), true)
})

test('should be able to load the latest value', async (t) => {
  const id0 = await service.load(1, InternalIdUsage.Env)
  await service.generate(1, InternalIdUsage.Env)
  await service.generate(1, InternalIdUsage.Env)
  const id2 = await service.load(1, InternalIdUsage.Env)

  t.is(id0, 0)
  t.is(id2, 2)
})

test('should be able to save greatest value', async (t) => {
  let id3 = await service.save(1, InternalIdUsage.Env, 3)
  t.is(id3, 3)

  // not allowed to save a value less then last value
  id3 = await service.save(1, InternalIdUsage.Env, 2)
  t.is(id3, 3)
})
