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

import { execSync } from 'child_process'

import { MIN_CHROME_VERSION, MAX_CHROME_VERSION } from './utils'
import { getWin32ChromeVersionInfo } from './win32'

export function isSuitableVersion(executablePath: string, min = MIN_CHROME_VERSION, max = MAX_CHROME_VERSION) {
  if (min > max) {
    throw new Error(
      "ERROR: Passed options for limiting chrome versions are incorrect. Min couldn't be bigger then Max.",
    )
  }

  let versionOutput: string

  try {
    // In case installed Chrome is not runnable
    versionOutput = chromeVersion(executablePath)
  } catch (e) {
    return false
  }

  const chromeVersionRegExp = /(Google Chrome|Chromium) ([0-9]{2,}).*/

  const match = versionOutput.match(chromeVersionRegExp)

  if (match?.[2]) {
    const version = parseInt(match[2], 10)
    return min <= version && version <= max
  }

  return false
}

export function chromeVersion(executablePath: string) {
  return (
    process.platform === 'win32'
      ? getWin32ChromeVersionInfo(executablePath)
      : execSync(`"${executablePath}" --version`).toString()
  ).trim()
}
