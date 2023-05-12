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

import { existsSync } from 'fs'
import { mkdir, writeFile } from 'fs/promises'
import { tmpdir } from 'os'

import chalk from 'chalk'
import esbuild from 'esbuild'
import { glob } from 'glob'

import { analyze } from './analyzer'
import { runBrowser } from './benchmark/browser'
import { runNode } from './benchmark/node'
import { PackageJson, PackOptions } from './types'

const bundlingBenchmark = async (path: string, outfile: string, options: PackOptions = {}) => {
  const files = await glob(options.benchmarkPattern ?? ['**/*.benchmark.{ts,js}', '**/*.bench.{ts,js}'], {
    ignore: 'node_modules/**',
    root: path,
    dotRelative: true,
  })
  if (!files.length) {
    return false
  }
  !options.local && console.info('[perfsee] Target is browser. Benchmarks will run in server.')
  try {
    const injectionDir = `${tmpdir()}/perfsee-package`
    const injectionPath = `${injectionDir}/injection.js`
    if (!existsSync(injectionPath)) {
      await mkdir(injectionDir, { recursive: true })
      await writeFile(
        injectionPath,
        `
      const processShim = {
        env: {},
        cwd: () => '',
      }
      export { processShim as process }
      `,
      )
    }
    await esbuild.build({
      stdin: {
        contents: files.map((f) => `require("${f}")`).join('\n'),
        resolveDir: '.',
      },
      bundle: true,
      sourcemap: true,
      outfile,
      target: 'esnext',
      platform: 'browser',
      inject: [injectionPath],
    })
  } catch (e) {
    console.error(chalk.red('[perfsee] error occured when bundling benchmark.'))
  }
  return true
}

export const anaylize = async (path: string, packageJson: PackageJson, options: PackOptions = {}) => {
  const { name, version } = packageJson
  const outputDir = `${tmpdir()}/perfsee-package/${`${name}-${version}-${Date.now()}`
    .replace(/^@/, '')
    .replace(/\//, '-')}`

  await mkdir(outputDir, { recursive: true })

  console.info('[perfsee] start package analyzing.')
  const packageStats = await analyze(path, options)
  await writeFile(`${outputDir}/package-stats.json`, JSON.stringify(packageStats))
  console.info('[perfsee] package analysis success.')

  // if target is browser, we run benchmark on job runner
  // otherwise we run locally
  if (options.target === 'browser') {
    const benchmarkFilePath = `${outputDir}/benchmark.js`
    const hasBenchmark = await bundlingBenchmark(path, benchmarkFilePath, options)

    // if `--local` was set, we run in local
    if (hasBenchmark && options.local) {
      console.info('[perfsee] Benchmark will run in local because --local flag was set.')
      try {
        const benchmarkResult = await runBrowser(benchmarkFilePath, {
          timeout: Number(options.benchmarkTimeout),
          open: true,
          devtools: true,
        })
        await writeFile(`${outputDir}/benchmark.json`, JSON.stringify(benchmarkResult))
      } catch (e: any) {
        console.error('[perfsee] Benchmark running error.', e?.message ?? String(e))
      }
    }
  } else {
    const files = await glob(options.benchmarkPattern ?? ['**/*.benchmark.{ts,js}', '**/*.bench.{ts,js}'], {
      ignore: 'node_modules/**',
      root: path,
      absolute: true,
    })
    if (files.length) {
      console.info('[perfsee] Running benchmarks...')
      try {
        const benchmarkResult = await runNode(files, { timeout: Number(options.benchmarkTimeout) })
        await writeFile(`${outputDir}/benchmark.json`, JSON.stringify(benchmarkResult))
      } catch (e: any) {
        console.error('[perfsee] Benchmark running error.', e?.message ?? String(e))
      }
    }
  }

  await writeFile(`${outputDir}/options.json`, JSON.stringify(options))

  return outputDir
}
