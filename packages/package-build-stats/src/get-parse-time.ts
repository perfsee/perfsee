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

/*
Portions of this software were originally licensed under the MIT License.
See the MIT License for more details.
*/

/*
MIT License

Copyright (c) 2017 Shubham Kanodia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/*
The modifications to the original software were made by ByteDance,
and are licensed under the Apache License, Version 2.0.
*/

import fs from 'fs'
import path from 'path'

import now from 'performance-now'
import stats from 'stats-lite'
import { VMScript } from 'vm2'

const debug = require('debug')('bp:worker')

function getParseTime(currentScript: string, trialCount = 5) {
  let baseVMScript, currentVMScript

  let baseCounter = 0
  const baseResults = []

  let currentCounter = 0
  const currentResults = []

  const baseScript = fs.readFileSync(path.join(__dirname, 'fixed', 'parseReference.js'), 'utf8')

  try {
    while (baseCounter++ < trialCount) {
      baseVMScript = new VMScript(`${Math.random()}; ${baseScript}`)
      const start = now()
      baseVMScript.compile()
      const end = now()
      baseResults.push(end - start)
    }

    while (currentCounter++ < trialCount) {
      currentVMScript = new VMScript(`${Math.random()}; ${currentScript}`)
      const start = now()
      currentVMScript.compile()
      const end = now()
      currentResults.push(end - start)
    }

    const baseMedian = stats.median(baseResults)
    const currentMedian = stats.median(currentResults)

    debug('base parse time: %d | script parse time: %d', baseMedian, currentMedian)
    debug('base deviation: %d | script deviation: %d', stats.stdev(baseResults), stats.stdev(currentResults))

    debug('parse time ratio', currentMedian / baseMedian)

    return {
      baseParseTime: baseMedian,
      scriptParseTime: currentMedian,
    }
  } catch (err) {
    console.error('Failed to get parsed times, is this a valid JS file?')
    return {}
  }
}

export default getParseTime
