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

import { execSync, execFileSync } from 'child_process'
import { homedir } from 'os'
import { join } from 'path'

import { newLineRegex, canAccess } from './utils'

export function findChromeBinaryOnLinux(_canary = false) {
  let installations: string[] = []

  // Look into the directories where .desktop are saved on gnome based distro's
  const desktopInstallationFolders = [join(homedir(), '.local/share/applications/'), '/usr/share/applications/']

  desktopInstallationFolders.forEach((folder) => {
    installations = installations.concat(findChromeExecutables(folder))
  })

  // Look for google-chrome(-stable) & chromium(-browser) executables by using the which command
  const executables = ['google-chrome-stable', 'google-chrome', 'chromium-browser', 'chromium']
  executables.forEach((executable) => {
    try {
      const chromePath = execFileSync('which', [executable], { stdio: 'pipe' }).toString().split(newLineRegex)[0]
      if (canAccess(chromePath)) installations.push(chromePath)
    } catch (e) {
      // Not installed.
    }
  })

  if (!installations.length) {
    return undefined
  }

  const priorities = [
    { regex: /chrome-wrapper$/, weight: 51 },
    { regex: /google-chrome-stable$/, weight: 50 },
    { regex: /google-chrome$/, weight: 49 },
    { regex: /chromium-browser$/, weight: 48 },
    { regex: /chromium$/, weight: 47 },
  ]

  if (process.env.CHROME_PATH) {
    priorities.unshift({
      regex: new RegExp(`${process.env.CHROME_PATH}`),
      weight: 101,
    })
  }

  return sort(uniq(installations.filter(Boolean)), priorities)[0]
}

function findChromeExecutables(folder: string) {
  const installations: string[] = []
  const argumentsRegex = /(^[^ ]+).*/
  const chromeExecRegex = '^Exec=/.*/(google-chrome|chrome|chromium)-.*'

  if (canAccess(folder)) {
    let execPaths

    try {
      execPaths = execSync(`grep -ER "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`)
    } catch (e) {
      execPaths = execSync(`grep -Er "${chromeExecRegex}" ${folder} | awk -F '=' '{print $2}'`)
    }

    execPaths = execPaths
      .toString()
      .split(newLineRegex)
      .map((execPath) => execPath.replace(argumentsRegex, '$1'))

    execPaths.forEach((execPath) => canAccess(execPath) && installations.push(execPath))
  }

  return installations
}

function sort(installations: string[], priorities: Array<{ regex: RegExp; weight: number }>) {
  const defaultPriority = 10
  return installations
    .map((inst) => {
      for (const pair of priorities) {
        if (pair.regex.test(inst)) return { path: inst, weight: pair.weight }
      }
      return { path: inst, weight: defaultPriority }
    })
    .sort((a, b) => b.weight - a.weight)
    .map((pair) => pair.path)
}

function uniq<T>(arr: T[]) {
  return Array.from(new Set(arr))
}
