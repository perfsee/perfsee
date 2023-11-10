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

import { isSuitableVersion, chromeVersion } from './chrome'
import { findChromeBinaryOnDarwin } from './darwin'
import { findChromeBinaryOnLinux } from './linux'
import { findChromeBinaryOnWin32 } from './win32'

interface FindOptions {
  /**
   * Canary version of chrome wanted
   */
  canary?: boolean
  /**
   * Min suitable version
   */
  min?: number
  /**
   * Max suitable version
   */
  max?: number
}

interface FindResult {
  executablePath?: string
  browser?: string
}

export function findChrome({ min, max, canary }: FindOptions = {}): Promise<FindResult> {
  const executablePath = findChromeBinaryPath(canary)
  const isNotEmpty = typeof executablePath === 'string' && executablePath.length > 0
  const isSuitable = isNotEmpty && isSuitableVersion(executablePath, min, max)

  if (isSuitable) {
    return Promise.resolve({ executablePath, browser: chromeVersion(executablePath) })
  }

  throw new Error("Couldn't find suitable Chrome version locally.")
}

function findChromeBinaryPath(canary?: boolean) {
  let getter

  switch (process.platform) {
    case 'linux':
      getter = findChromeBinaryOnLinux
      break
    case 'win32':
      getter = findChromeBinaryOnWin32
      break
    case 'darwin':
      getter = findChromeBinaryOnDarwin
      break
    default:
      throw new Error('Unsupported platform')
  }

  return process.env.CHROMIUM_EXECUTABLE_PATH ?? process.env.PUPPETEER_EXECUTABLE_PATH ?? getter(canary)
}
