import fs from 'fs/promises'
import path from 'path'

import test from 'ava'

import JSONR from '..'

test('simple stringify & parse', (ctx) => {
  const obj = { a: { hello: 'world', foooobar: 1, undefined: undefined }, b: [] as any[] }
  obj.b.push(obj.a, obj.a, obj.a)

  const jsonr = JSONR.stringify(obj)
  ctx.snapshot(jsonr)
  ctx.deepEqual(JSONR.parse(jsonr), obj)
})

test('replacer', (ctx) => {
  const obj = { hello: 'world', foooobar: 1 }

  {
    const jsonr = JSONR.stringify(obj, (k, v) => {
      return k === 'foooobar' ? 2 : v
    })
    ctx.deepEqual(JSONR.parse(jsonr), { hello: 'world', foooobar: 2 })
  }

  {
    const jsonr = JSONR.stringify(obj, (k, v) => {
      return k === 'hello' ? 'json' : v
    })
    ctx.deepEqual(JSONR.parse(jsonr), { hello: 'json', foooobar: 1 })
  }
})

test('run test cases', async (ctx) => {
  const files = await fs.readdir(path.join(__dirname, './test_cases'))
  for (const file of files) {
    try {
      const jsonstr = await fs.readFile(path.join(__dirname, './test_cases', file), 'utf8')
      const value = JSON.parse(jsonstr)
      ctx.deepEqual(value, JSONR.parse(jsonstr), file)
      ctx.deepEqual(value, JSONR.parse(JSONR.stringify(value)), file)
    } catch (err) {
      ctx.fail(file + ' ' + (err as Error).stack)
    }
  }
})

// skip this test on ci, is slow and may cause OOM
test.skip('stream large object', (ctx) => {
  ctx.timeout(1000 * 60 * 3 /* 3 minutes */)
  const largeObj: number[] = []
  const iterCount = (1024 * 1024 * 500) / 16 /* 500MB(max v8 string length) / 16B(per property) */
  for (let i = 0; i < iterCount; i++) {
    largeObj.push(9007199254740991)
  }
  ctx.throws(() => {
    JSON.stringify(largeObj)
  })
  const largeStream = Array.from(JSONR.stringifyStream(largeObj))
  ctx.log('test large object length:' + largeStream.reduce((p, s) => p + s.length, 0))
  ctx.assert(largeStream.reduce((p, s) => p + s.length, 0) > 1024 * 1024 * 500)
  const largeObj2 = JSONR.parseStream(largeStream)
  ctx.assert(largeObj2.length === largeObj.length)
  ctx.assert(largeObj2[1000] === largeObj[1000])
})

test('benchmark - stringify', async (ctx) => {
  const testJson = await fs.readFile(path.join(__dirname, './test_cases/test.json'), 'utf-8')
  const value = JSON.parse(testJson)
  const testMBs = (testJson.length * 1000) / 1024 / 1024

  {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      JSONR.stringify(value)
    }
    const end = performance.now()
    ctx.log(
      'JSONR - stringify ' + (end - start).toFixed(2) + 'ms ' + ((testMBs / (end - start)) * 1000).toFixed(2) + 'MB/s',
    )
  }

  {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      JSON.stringify(value)
    }
    const end = performance.now()
    ctx.log(
      'Native JSON - stringify ' +
        (end - start).toFixed(2) +
        'ms ' +
        ((testMBs / (end - start)) * 1000).toFixed(2) +
        'MB/s',
    )
  }

  ctx.pass()
})

test('benchmark - parse', async (ctx) => {
  const testJson = await fs.readFile(path.join(__dirname, './test_cases/test.json'), 'utf-8')

  const testMBs = (testJson.length * 1000) / 1024 / 1024

  {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      JSONR.parse(testJson)
    }
    const end = performance.now()
    ctx.log(
      'JSONR - parse ' + (end - start).toFixed(2) + 'ms ' + ((testMBs / (end - start)) * 1000).toFixed(2) + 'MB/s',
    )
  }

  {
    const start = performance.now()
    for (let i = 0; i < 1000; i++) {
      JSON.parse(testJson)
    }
    const end = performance.now()
    ctx.log(
      'Native JSON - parse ' +
        (end - start).toFixed(2) +
        'ms ' +
        ((testMBs / (end - start)) * 1000).toFixed(2) +
        'MB/s',
    )
  }

  ctx.pass()
})
