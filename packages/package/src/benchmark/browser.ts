/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { readFile } from 'fs/promises'

import puppeteer from 'puppeteer-core'

import { findChrome } from '@perfsee/chrome-finder'

import { getConsoleLogger } from '../analyzer'
import { BenchmarkResult } from '../types'

export interface BrowserOptions {
  open?: boolean
  devtools?: boolean
  timeout?: number
}

export async function runBrowser(
  filePath: string,
  options?: BrowserOptions,
  logger = getConsoleLogger(),
): Promise<BenchmarkResult> {
  const file = await readFile(filePath, 'utf-8')

  const browser = await puppeteer.launch({
    headless: !options?.open,
    devtools: options?.devtools,
    args: ['--no-sandbox', '--js-flags="--max-old-space-size=2048"'],
    executablePath: (await findChrome()).executablePath,
  })

  const page = await browser.newPage()

  const onDisconnected = () => {
    logger.error('Browser has disconnected.')
    process.exit(-1)
  }
  browser.on('disconnected', onDisconnected)

  const benchmark: BenchmarkResult = {
    results: [] as any[],
  }

  page.on('console', (msg) => {
    const type = msg.type()
    const text = msg.text()
    switch (type) {
      case 'info':
        logger.info(text)
        break
      case 'error':
        logger.error(text)
        break
      case 'warn':
        logger.warn(text)
        break
      default:
        logger.verbose(text)
    }
  })
  const cdp = await page.target().createCDPSession()
  await page.evaluate(() => (window.benchmarks = []))

  await cdp.send('Profiler.enable')

  await Promise.all([
    page.addScriptTag({
      url: 'https://unpkg.com/lodash@4.17.21/lodash.min.js',
    }),
    page.addScriptTag({
      url: 'https://unpkg.com/platform@1.3.6/platform.js',
    }),
    page.addScriptTag({
      url: 'https://unpkg.com/benchmark@2.1.4/benchmark.js',
    }),
  ])

  await page.exposeFunction('pushResult', (result: any) => benchmark.results.push(result))

  const runBenchmarks = async () => {
    await page.evaluate(async () => {
      for (const test of window.benchmarks) {
        await test()
      }
    })
  }
  const timeout = new Promise((resolve) =>
    setTimeout(resolve, options?.timeout ? options.timeout * 1000 : 120000),
  ).then(() => {
    logger.error('Benchmark timeout.')
    return Promise.resolve()
  })

  await page.addScriptTag({
    content: file.toString(),
  })

  await cdp.send('Profiler.start')

  await Promise.race([timeout, runBenchmarks()])
  logger.info('Benchark recording profile...')
  const { profile } = await cdp.send('Profiler.stop')
  benchmark.profiles = [profile]

  await page.close()

  browser.off('disconnected', onDisconnected)

  await browser.close()

  return benchmark
}
