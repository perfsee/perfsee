---
id: benchmark-api
title: Benchmark API
sidebar_position: 3
---

The benchmark API in `@perfsee/package` is quite simple.

## Quick example

```js
const Benchmark = require('@perfsee/package')

Benchmark('Reduce elements', () => {
  ;[1, 2].reduce((a, b) => a + b)
})

/**
 * If the code that you want to benchmark requires setup,
 * you should return it wrapped in a function:
 */
Benchmark('My second case', () => {
  // Some setup:
  const testArr = Array.from({ length: 1000 }, (_, index) => index)

  // Benchmarked code wrapped in a function:
  return () => myOtherFunction(testArr)
})
```

If you prefer to writting in typescript:

```ts
import Benchmark from '@perfsee/package'

Benchmark('Reduce elements', () => {
  ;[1, 2].reduce((a, b) => a + b)
})
```

### Multiple cases

```js
const Benchmark = require('@perfsee/package')

Benchmark('Many cases', [
  {
    test: () => {
      ;[1, 2].reduce((a, b) => a + b)
    },
    options: {
      name: 'reduce two elements',
    },
  },
  {
    test: () => {
      ;[1, 2, 3, 4, 5].reduce((a, b) => a + b)
    },
    options: {
      name: 'reduce five elements',
    },
  },
])
```

## Multiple suites

You can create as many suites as you want. It is a good practice to define each suite in a separate file.

If target is set to `browser`, each benchmark file will start a page of headless chrome.

## Working with async code

You can have async benchmarks, async setup, or both.

```js
Benchmark('Async benchmark without setup', async () => {
  // You can use await or return - works the same,
  // (async function always returns a Promise)
  await delay(0.5) // Resulting in 2 ops/s
})
```

```js
Benchmark('Async benchmark with some setup', async () => {
  await delay(2) // Setup can be async, it will not affect the results

  return async () => {
    await delay(0.5) // Still 2 ops/s
  }
})
```

```js
Benchmark('Sync benchmark with some async setup', async () => {
  await delay(2) // Setup can be async, it will not affect the results

  return () => {
    1 + 1 // High ops, not affected by slow, async setup
  }
})
```

## Options

If the default results are not optimal (high error margin, etc.), you can change parameters for each case by providing an options object as a parameter.

Available options:

```ts
/**
 * The delay between test cycles (secs).
 *
 * @default 0.005
 */
delay: number

/**
 * The default number of times to execute a test on a benchmark's first cycle.
 *
 * @default 1
 */
initCount: number

/**
 * The maximum time a benchmark is allowed to run before finishing (secs).
 *
 * Note: Cycle delays aren't counted toward the maximum time.
 *
 * @default 5
 */
maxTime: number

/**
 * The minimum sample size required to perform statistical analysis.
 *
 * @default 5
 */
minSamples: number

/**
 * The time needed to reduce the percent uncertainty of measurement to 1% (secs).
 *
 * @default 0
 */
minTime: number
```

Example:

```js
Benchmark('My case', [
  {
    test: () => {
      ;[1, 2].reduce((a, b) => a + b)
    },
    options: {
      name: 'reduce two elements',
      minSample: 20,
    },
  },
])
```
