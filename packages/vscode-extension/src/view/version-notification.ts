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

import { window } from 'vscode'

import { Commands } from '../constants'
import app from '../core'
import settings from '../settings'

import { executeCommand } from './commands'

export function HashNotification() {
  const mem: Record<number, string | null | undefined> = {}
  return app.onDidProjectsUpdateEvent(({ next }) => {
    for (const project of next) {
      const oldHash = mem[project.id]
      const newHash = project.activatedHash?.name
      const settingHash = settings.project.hash[project.id]

      if (!newHash) continue

      if (settingHash) {
        // if the hash is set manually
        mem[project.id] = null
        continue
      }

      if (oldHash && oldHash !== newHash) {
        // if hash has changed

        void window
          .showInformationMessage(
            `Perfsee platform has data updates. The hash of project "${project.id}" has been automatically changed from "${oldHash}" to "${newHash}".`,
            { title: 'Change Hash' as const },
          )
          .then((action) => {
            if (action?.title === 'Change Hash') {
              return executeCommand(Commands.ChangeHash, project.id)
            }
          })
      }

      mem[project.id] = newHash
    }
  })
}
