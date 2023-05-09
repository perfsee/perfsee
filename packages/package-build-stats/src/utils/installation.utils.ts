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

import { promises as fs } from 'fs'
import path from 'path'
import { performance } from 'perf_hooks'

import rimraf from 'rimraf'
import sanitize from 'sanitize-filename'
import shortId from 'shortid'

import { InstallPackageOptions } from '../common.types'
import config from '../config/config'
import { InstallError, PackageNotFoundError } from '../errors/custom-error'

import { exec } from './common.utils'
import Telemetry from './telemetry.utils'

const debug = require('debug')('bp:worker')

// When operating on a local directory, force npm to copy directory structure
// and all dependencies instead of just symlinking files
const wrapPackCommand = (packagePath: string) => `$(npm pack --ignore-scripts ${packagePath} | tail -1)`

const sanitizeCommand = (command: string) => {
  if (['&', '&&', '|', '||', ';', '`', '\n', '$('].some((c) => command.includes(c))) {
    throw new Error('Invalid package string or additional packages.')
  }

  return command
}

const InstallationUtils = {
  getInstallPath(packageName: string) {
    const id = shortId.generate().slice(0, 3)
    return path.join(config.tmp, 'packages', sanitize(`build-${packageName}-${id}`))
  },

  getLocalPath(packageString: string) {
    const id = shortId.generate().slice(0, 3)
    return path.join(packageString, sanitize(`build-${id}`))
  },

  async prepareLocalPath(packageString: string) {
    const localPath = InstallationUtils.getLocalPath(packageString)
    await fs.mkdir(localPath, { recursive: true })

    return localPath
  },

  async preparePath(packageString: string, packageName: string, isLocal?: boolean) {
    if (isLocal) {
      return InstallationUtils.prepareLocalPath(packageString)
    }

    const installPath = InstallationUtils.getInstallPath(packageName)

    await fs.mkdir(config.tmp, { recursive: true })
    await fs.mkdir(installPath, { recursive: true })

    await fs.writeFile(
      path.join(installPath, 'package.json'),
      JSON.stringify({
        dependencies: {},
        browserslist: ['last 5 Chrome versions', 'last 5 Firefox versions', 'Safari >= 9', 'edge >= 12'],
      }),
    )

    return installPath
  },

  async installPackage(packageString: string, installPath: string, installOptions: InstallPackageOptions) {
    if (installOptions.isLocal) {
      return
    }

    let flags, command
    const installStartTime = performance.now()

    const {
      client = 'npm',
      limitConcurrency,
      networkConcurrency,
      additionalPackages = [],
      isLocal,
      installTimeout = 60000,
    } = installOptions

    if (client === 'yarn') {
      flags = [
        'ignore-flags',
        'ignore-engines',
        'skip-integrity-check',
        'exact',
        'json',
        'no-progress',
        'silent',
        'no-lockfile',
        'no-bin-links',
        'no-audit',
        'no-fund',
        'ignore-optional',
      ]
      if (limitConcurrency) {
        flags.push('mutex network')
      }

      if (networkConcurrency) {
        flags.push(`network-concurrency ${networkConcurrency}`)
      }
      command = `yarn add ${packageString} ${additionalPackages.join(' ')} --${flags.join(' --')}`
    } else if (client === 'npm') {
      flags = [
        // Setting cache is required for concurrent `npm install`s to work
        `cache=${path.join(config.tmp, 'cache')}`,
        'no-package-lock',
        'no-shrinkwrap',
        'legacy-peer-deps',
        'no-optional',
        'no-bin-links',
        'progress false',
        'loglevel error',
        'ignore-scripts',
        'save-exact',
        'production',
        'json',
      ]

      command = `npm install ${isLocal ? wrapPackCommand(packageString) : packageString} ${additionalPackages.join(
        ' ',
      )} --${flags.join(' --')}`
    } else if (client === 'pnpm') {
      flags = ['no-optional', 'loglevel error', 'ignore-scripts', 'save-exact']

      command = `pnpm add ${packageString} ${additionalPackages.join(' ')} --${[flags].join(' --')}`
    } else {
      console.error('No valid client specified')
      process.exit(1)
    }

    debug('install start %s', packageString)

    try {
      await exec(
        sanitizeCommand(command),
        {
          cwd: installPath,
          maxBuffer: 1024 * 500,
        },
        installTimeout,
      )

      debug('install finish %s', packageString)
      Telemetry.installPackage(packageString, true, installStartTime, installOptions)
    } catch (err) {
      console.error(err)
      Telemetry.installPackage(packageString, false, installStartTime, installOptions)
      if (typeof err === 'string' && err.includes('code E404')) {
        throw new PackageNotFoundError(err)
      } else {
        throw new InstallError(err)
      }
    }
  },

  cleanupPath(installPath: string) {
    const noop = () => {}
    try {
      rimraf(installPath, noop)
    } catch (err) {
      console.error('cleaning up path ', installPath, ' failed due to ', err)
    }
  },
}

export default InstallationUtils
