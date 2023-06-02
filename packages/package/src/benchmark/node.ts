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
import { tmpdir } from 'os'
import { Worker } from 'worker_threads'

import chalk from 'chalk'

import { BenchmarkResult } from '../types'

import { Summary } from './internal/common-types'

export interface NodeOptions {
  timeout?: number
}

export async function runNode(filePaths: string[], options?: NodeOptions): Promise<BenchmarkResult> {
  const cpuProfileFile = `${tmpdir()}/profile.cpuprofile`

  const nodeExecuteContent = `
const inspector = require('inspector');
const fs = require('fs');
const { parentPort } = require('worker_threads');

const session = new inspector.Session();
session.connect();
global.benchmarks = [];
global.pushResult = (result) => {
  parentPort?.postMessage(result)
}

const runBenchmarks = async () => {
  for (const test of global.benchmarks) {
    await test()
  }
}

require('ts-node/register/transpile-only')
${filePaths.map((path) => `require('${path}')`).join('\n')}

session.post('Profiler.enable', () => {
  session.post('Profiler.start', () => {
    runBenchmarks().then(() => {
      session.post('Profiler.stop', (err, { profile }) => {
        if (!err) {
          fs.writeFileSync('${cpuProfileFile}', JSON.stringify(profile));
        }
      });
    });
  });
});
  `
  const worker = new Worker(nodeExecuteContent, { eval: true })
  const results: Summary[] = []

  return new Promise<BenchmarkResult>((resolve, reject) => {
    setTimeout(
      () => {
        reject('Timeout!')
      },
      options?.timeout ? options.timeout * 1000 : 120000,
    )

    worker.on('error', (err) => {
      console.error(chalk.red('[perfsee] Benchmark running error:'), err)
      reject(err)
    })

    worker.on('message', (result) => results.push(result as Summary))
    worker.on('exit', () => {
      void readFile(cpuProfileFile, 'utf-8').then((json) => {
        const profile = JSON.parse(json)
        resolve({
          results,
          profiles: [profile],
        })
      })
    })
  })
}
