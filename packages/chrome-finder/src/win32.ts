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
import { existsSync } from 'fs'
import { sep, join } from 'path'

import { canAccess } from './utils'

export function findChromeBinaryOnWin32(canary = false) {
  const suffix = canary
    ? `${sep}Google${sep}Chrome SxS${sep}Application${sep}chrome.exe`
    : `${sep}Google${sep}Chrome${sep}Application${sep}chrome.exe`

  const prefixes = [
    process.env.LOCALAPPDATA,
    process.env.PROGRAMFILES,
    process.env['PROGRAMFILES(X86)'],
    process.env.ProgramFiles,
    process.env['ProgramFiles(x86)'],
  ].filter(Boolean)

  let result: string | undefined

  prefixes.forEach((prefix) => {
    const chromePath = join(prefix!, suffix)
    if (existsSync(chromePath) && canAccess(chromePath)) {
      result = chromePath
    }
  })

  return result
}

export function getWin32ChromeVersionInfo(executablePath: string) {
  const executablePathForNode = executablePath.replace(/\\/g, '\\\\')
  const wmiResult = execSync(
    `wmic datafile where name="${executablePathForNode}" GET Manufacturer,FileName,Version /format:csv`,
    { stdio: ['pipe', 'pipe', 'ignore'] },
  )

  const wmiResultAsStringArray = wmiResult
    .toString()
    .replace(/^\r\r\n/, '')
    .replace(/\r\r\n$/, '')
    .split('\r\r\n')

  if (wmiResultAsStringArray.length === 2) {
    const columnNames = wmiResultAsStringArray[0].split(',')
    const values = wmiResultAsStringArray[1].split(',')
    let manufacturer = ''
    let version = ''

    columnNames.forEach((columnName, index) => {
      switch (columnName) {
        case 'Manufacturer':
          if (values[index].includes('Chromium')) {
            manufacturer = 'Chromium'
          } else {
            manufacturer = 'Google Chrome'
          }
          break
        case 'Version':
          version = values[index]
          break
      }
    })

    return `${manufacturer} ${version}`
  } else {
    throw new Error(`No version information found for '${executablePath}'`)
  }
}
