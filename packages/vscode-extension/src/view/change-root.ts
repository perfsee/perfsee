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

import { QuickPickItem, Uri, window } from 'vscode'

import Project from '../core/project'
import settings, { updateSessionProjectRoot } from '../settings'
import Logger from '../utils/logger'

interface ActionQuickPickItem extends QuickPickItem {
  onClick: () => void
}

export function showChangeRootQuickPick(project: Project) {
  const quickPick = window.createQuickPick<ActionQuickPickItem>()
  const items: ActionQuickPickItem[] = []
  let activeItem: ActionQuickPickItem = null!

  const configurationRoot: string | undefined = settings.project.root[project.id]

  const autoItem = {
    label: 'Auto',
    description: `(${project.gitRoot})`,
    onClick: () => {
      updateSessionProjectRoot(project.id, null)
    },
  }
  items.push(autoItem)
  if (!configurationRoot) {
    activeItem = autoItem
  }

  const manuallyItem = {
    label: configurationRoot ? 'Update select folder' : 'Manually select folder',
    description: configurationRoot ? `(${configurationRoot})` : undefined,
    onClick: () => {
      void window
        .showOpenDialog({
          canSelectFolders: true,
          canSelectMany: false,
          defaultUri: Uri.file(project.root),
        })
        .then((path) => {
          if (path && path.length > 0) {
            updateSessionProjectRoot(project.id, path[0].fsPath)
          } else {
            Logger.debug('Operation canceled.')
          }
        })
    },
  }
  items.push(manuallyItem)
  if (configurationRoot) {
    activeItem = manuallyItem
  }

  quickPick.items = items
  quickPick.activeItems = [activeItem]
  quickPick.canSelectMany = false
  quickPick.show()

  quickPick.onDidAccept(() => {
    const selectedItem = quickPick.selectedItems[0]

    selectedItem.onClick()

    quickPick.hide()
  })
}
