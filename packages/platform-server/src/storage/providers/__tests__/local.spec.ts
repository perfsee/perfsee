import fs from 'fs'
import { join } from 'path'

import { Test } from '@nestjs/testing'

import test, { createMock } from '@perfsee/platform-server/test'

import { ObjectStorage } from '../local'

const baseDir = join(process.cwd(), '.local-object-storage')
const buf = Buffer.from([0x62, 0x75, 0x66, 0x66, 0x65, 0x72])

test.beforeEach(async (t) => {
  t.context.module = await Test.createTestingModule({
    providers: [ObjectStorage],
  })
    .useMocker(createMock)
    .compile()
})

test('upload', async (t) => {
  const storage = t.context.module.get(ObjectStorage)

  await storage.upload('testing_upload', buf)

  const result = fs.readFileSync(join(baseDir, 'testing_upload'))

  t.deepEqual(result, buf)
})

test('upload file', async (t) => {
  const storage = t.context.module.get(ObjectStorage)
  const file = join(__dirname, './local.spec.ts')

  await storage.uploadFile('testing_upload_file', file)

  const result = fs.readFileSync(join(baseDir, 'testing_upload_file'))

  t.deepEqual(result, fs.readFileSync(file))
})

test('get', async (t) => {
  const storage = t.context.module.get(ObjectStorage)

  await storage.upload('testing_get', buf)

  const result = await storage.get('testing_get')

  t.deepEqual(result, buf)
})

test('invalid path', async (t) => {
  const storage = t.context.module.get(ObjectStorage)

  await t.throwsAsync(storage.get('../testing_get'), { message: 'Invalid storage key' })
})

test('get stream', async (t) => {
  const storage = t.context.module.get(ObjectStorage)

  await storage.upload('testing_get_stream', buf)

  const stream = await storage.getStream('testing_get_stream')

  const result = await new Promise((resolve) => {
    const _buf: any[] = []
    stream.on('data', (chunk) => _buf.push(chunk))
    stream.on('end', () => {
      resolve(Buffer.concat(_buf))
    })
  })
  t.deepEqual(result, buf)
})
