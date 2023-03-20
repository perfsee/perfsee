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

import { performance } from 'perf_hooks'

import _ from 'lodash'
import mitt from 'mitt'

import { parsePackageString } from './common.utils'

const debug = require('debug')('bp-telemetry')

const emitter = mitt()
export { emitter }

emitter.on('*', (type, data) => {
  debug('Telementry Event: %s  %o', type, data)
})

function errorToObject(error: any) {
  if (!error) return
  if (error && typeof error === 'object') {
    const errorObject = {}

    Object.getOwnPropertyNames(error).forEach((key) => {
      errorObject[key] =
        typeof error[key] === 'object' ? errorToObject(error[key]) : String(error[key]).substring(0, 40)
    })
    return errorObject
  }
  return { error }
}

export default class Telemetry {
  static installPackage(
    packageString: string,
    isSuccessful: boolean,
    startTime: number,
    options: any,
    error: any = null,
  ) {
    emitter.emit('TASK_PACKAGE_INSTALL', {
      package: parsePackageString(packageString),
      isSuccessful,
      duration: performance.now() - startTime,
      options,
      error: errorToObject(error),
    })
  }

  static getPackageJSONDetails(packageJson: any, isSuccessful: boolean, startTime: number, error: any = null) {
    emitter.emit('TASK_PACKAGE_JSON_DETAILS', {
      package: packageJson,
      isSuccessful,
      duration: performance.now() - startTime,
      error: errorToObject(error),
    })
  }

  static buildPackage(packageName: string, isSuccessful: boolean, startTime: number, options: any, error: any = null) {
    emitter.emit('TASK_PACKAGE_BUILD', {
      package: { name: packageName },
      isSuccessful,
      duration: performance.now() - startTime,
      options: _.omit(options, 'customImports'),
      error: errorToObject(error),
    })
  }

  static compilePackage(
    packageName: string,
    isSuccessful: boolean,
    startTime: number,
    options: any,
    error: any = null,
  ) {
    emitter.emit('TASK_PACKAGE_COMPILE', {
      packageName,
      isSuccessful,
      duration: performance.now() - startTime,
      options,
      error: errorToObject(error),
    })
  }

  static packageStats(
    packageString: string,
    isSuccessful: boolean,
    startTime: number,
    options: any,
    error: any = null,
  ) {
    emitter.emit('TASK_PACKAGE_STATS', {
      package: parsePackageString(packageString),
      isSuccessful,
      duration: performance.now() - startTime,
      options,
      error: errorToObject(error),
    })
  }

  static parseWebpackStats(packageName: string, isSuccessful: boolean, startTime: number, error: any = null) {
    emitter.emit('TASK_PACKAGE_PARSE_WEBPACK_STATS', {
      package: { name: packageName },
      isSuccessful,
      duration: performance.now() - startTime,
      error: errorToObject(error),
    })
  }

  static dependencySizes(
    packageName: string,
    startTime: number,
    isSuccessful: boolean,
    options: any,
    error: any = null,
  ) {
    emitter.emit('TASK_PACKAGE_DEPENDENCY_SIZES', {
      package: { name: packageName },
      duration: performance.now() - startTime,
      isSuccessful,
      options,
      error: errorToObject(error),
    })
  }

  static assetsGZIPParseTime(packageName: string, startTime: number) {
    emitter.emit('TASK_PACKAGE_ASSETS_GZIP_PARSE_TIME', {
      package: { name: packageName },
      duration: performance.now() - startTime,
    })
  }

  static walkPackageExportsTree(packageString: string, startTime: number, isSuccessful: boolean, error: any = null) {
    emitter.emit('TASK_PACKAGE_EXPORTS_TREEWALK', {
      package: parsePackageString(packageString),
      isSuccessful,
      duration: performance.now() - startTime,
      error: errorToObject(error),
    })
  }

  static packageExports(packageString: string, startTime: number, isSuccessful: boolean, error: any = null) {
    emitter.emit('TASK_PACKAGE_EXPORTS', {
      package: parsePackageString(packageString),
      isSuccessful,
      duration: performance.now() - startTime,
      error: errorToObject(error),
    })
  }

  static packageExportsSizes(
    packageString: string,
    startTime: number,
    isSuccessful: boolean,
    options: any,
    error: any = null,
  ) {
    emitter.emit('TASK_PACKAGE_EXPORTS_SIZES', {
      package: parsePackageString(packageString),
      duration: performance.now() - startTime,
      isSuccessful,
      error: errorToObject(error),
      options,
    })
  }
}
