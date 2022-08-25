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
import { join } from 'path'

import { newLineRegex, canAccess } from './utils'

export function findChromeBinaryOnDarwin(canary = false) {
  const LSREGISTER =
    '/System/Library/Frameworks/CoreServices.framework' +
    '/Versions/A/Frameworks/LaunchServices.framework' +
    '/Versions/A/Support/lsregister'
  const grepexpr = canary ? 'google chrome canary' : 'google chrome'
  const result = execSync(`${LSREGISTER} -dump  | grep -i '${grepexpr}?.app$' | awk '{$1=""; print $0}'`)

  const paths = result
    .toString()
    .split(newLineRegex)
    .filter((a) => a)
    .map((a) => a.trim())

  paths.unshift(canary ? '/Applications/Google Chrome Canary.app' : '/Applications/Google Chrome.app')

  for (const p of paths) {
    if (p.startsWith('/Volumes')) {
      continue
    }
    const installation = join(p, canary ? '/Contents/MacOS/Google Chrome Canary' : '/Contents/MacOS/Google Chrome')
    if (canAccess(installation)) {
      return installation
    }
  }

  return undefined
}
