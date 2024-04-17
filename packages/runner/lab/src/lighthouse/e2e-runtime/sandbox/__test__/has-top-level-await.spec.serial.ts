import test from 'ava'

import { hasTopLevelAwait } from '../util'

const has = [
  `await doSomething()`,
  `const a = await doSomething()`,
  `call(a, await doSomething())`,
  `{ await doSomething() }`,
  `async function a() {}; await doSomething()`,
]

const notHas = [
  `async () => { await doSomething() }`,
  `async function x() { await doSomething() }`,
  `(async () => { await doSomething() })()`,
  `const a = 3;
  (async () => {
    const b = await doSomething();
    {
      const p = await doSomething();
    }
    const c = await doSomething()
  })().catch(err => {
    console.error(err)
  })
  `,
  `function b(){}; async () => { await doSomething() }`,
  `async () => { function b(){}; await doSomething() }`,
]

has.forEach((h) => {
  test(`code has top-level-await: ${h}`, (t) => {
    t.assert(hasTopLevelAwait(h))
  })
})

notHas.forEach((h) => {
  test(`code has no top-level-await: ${h}`, (t) => {
    t.assert(!hasTopLevelAwait(h))
  })
})
