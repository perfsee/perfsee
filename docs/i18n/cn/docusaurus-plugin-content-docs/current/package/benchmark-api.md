---
id: benchmark-api
title: Benchmark API
sidebar_position: 3
---

`@perfsee/package` 中的 Benchmark API 非常简单。

## 简单例子

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

同时支持 ts:

```ts
import Benchmark from '@perfsee/package'

Benchmark('Reduce elements', () => {
  ;[1, 2].reduce((a, b) => a + b)
})
```

### 多个 cases

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

## 多个 suites

你可以创建多个 suites。推荐将每一个 suite 都写在一个单独的文件中。

如果 target 设置为 browser，每个 benchmark 文件都会启动一个无头浏览器页面来运行。

## 异步代码

你可以编写异步用例，或者异步 setup。

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

如果默认运行的结果存在偏差（比如方差过高等），你可以设置每个 case 的运行参数。

可用 options:

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
