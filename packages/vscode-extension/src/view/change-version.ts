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

import { CancellationTokenSource, Disposable, QuickPick, QuickPickItem, window } from 'vscode'

import Project, { HashSchema } from '../core/project'
import settings, { updateSessionProjectHash } from '../settings'

interface ActionQuickPickItem extends QuickPickItem {
  submit: boolean
  onClick: () => void
}

class ChangeHashQuickPickController {
  searchResult: HashSchema | null = null
  isSearching = false
  hashes: HashSchema[] = []
  pageSize = 20
  endCursor: string | null = null
  hasNext = true
  disposable: Disposable
  quickPick: QuickPick<ActionQuickPickItem>
  searchCancellationTokenSource: CancellationTokenSource = new CancellationTokenSource()
  loadMoreCancellationTokenSource: CancellationTokenSource = new CancellationTokenSource()
  busyCounter = 0
  configurationHash: string | null = null

  constructor(public project: Project) {
    this.quickPick = window.createQuickPick<ActionQuickPickItem>()
    this.quickPick.canSelectMany = false

    this.configurationHash = settings.project.hash[this.project.id] ?? null

    this.disposable = Disposable.from(
      this.quickPick.onDidAccept(() => this.onDidAccept()),
      this.quickPick.onDidChangeValue((value) => this.onDidChangeValue(value)),
      this.quickPick.onDidHide(() => this.disposable.dispose()),
      new Disposable(() => {
        this.searchCancellationTokenSource.cancel()
      }),
    )
  }

  async show() {
    if (this.hashes.length === 0 && this.hasNext) await this.loadMore()

    this.quickPick.show()
  }

  async loadMore(jumpPosition?: number) {
    this.busy()
    try {
      this.loadMoreCancellationTokenSource.cancel()
      this.loadMoreCancellationTokenSource = new CancellationTokenSource()
      const cancellationToken = this.loadMoreCancellationTokenSource.token

      const { hashes, pageInfo } = await this.project.fetchHashes({
        first: this.pageSize,
        after: this.endCursor ?? undefined,
      })

      if (cancellationToken.isCancellationRequested) {
        return
      }

      this.hashes.push(...hashes)
      this.endCursor = pageInfo.endCursor
      this.hasNext = pageInfo.hasNextPage
      this.render()
      if (typeof jumpPosition === 'number') {
        const jumpItem = this.quickPick.items[Math.min(jumpPosition, this.quickPick.items.length)]
        this.quickPick.activeItems = [jumpItem] // control scroll bar position
      }
    } finally {
      this.unbusy()
    }
  }

  onDidAccept() {
    const selectedItem = this.quickPick.selectedItems[0]
    selectedItem.onClick()
    if (selectedItem.submit) this.quickPick.hide()
  }

  async onDidChangeValue(value: string) {
    this.busy()
    try {
      // fired when the user enters the hash name in the search bar
      this.searchCancellationTokenSource.cancel()
      this.searchCancellationTokenSource = new CancellationTokenSource()
      const cancellationToken = this.searchCancellationTokenSource.token

      if (!value) {
        // exit search mode
        this.searchResult = null
        this.isSearching = false
        this.render()
        return
      }

      // enter search mode
      this.searchResult = null
      this.isSearching = true
      this.render()

      await new Promise((resolve) => setTimeout(resolve, 300)) // debounce 300ms

      if (cancellationToken.isCancellationRequested) {
        return
      }

      let searchResult = this.hashes.find((hash) => hash.name === value) ?? null

      if (!searchResult) {
        // the hash is not found in the existing hashes list
        searchResult = await this.project.fetchHash(value) // search the hash via api
      }

      if (cancellationToken.isCancellationRequested) {
        return
      }

      this.searchResult = searchResult
      this.isSearching = true
      this.render()
    } finally {
      this.unbusy()
    }
  }

  render() {
    const items: ActionQuickPickItem[] = []
    const hashes = [...this.hashes]
    let configurationItem: ActionQuickPickItem = null!

    const configurationHash = settings.project.hash[this.project.id]

    const autoItem = {
      label: 'Auto',
      submit: true,
      description:
        !configurationHash && this.project.activatedHash ? `(${this.project.activatedHash.name})` : undefined,
      onClick: () => {
        updateSessionProjectHash(this.project.id, null)
      },
    }
    if (!this.isSearching) {
      items.push(autoItem)
    }
    if (!configurationHash) {
      configurationItem = autoItem
    }

    if (this.searchResult && !hashes.includes(this.searchResult)) {
      hashes.push(this.searchResult)
    }

    for (const hash of hashes) {
      const item = {
        label: hash.name,
        submit: true,
        description: `$(git-branch) ${hash.branch}`,
        onClick: () => {
          updateSessionProjectHash(this.project.id, hash.name)
        },
      }
      items.push(item)
      if (this.configurationHash === hash.name) {
        configurationItem = item
      }
    }

    for (const item of items) {
      if (configurationItem === item) {
        item.label = `$(circle-filled) ${item.label}`
      } else {
        item.label = `$(circle-outline) ${item.label}`
      }
    }

    if (!this.isSearching && this.hasNext) {
      const position = items.length
      items.push({
        label: 'Load more...',
        description: '',
        submit: false,
        onClick: () => {
          void this.loadMore(position)
        },
      })
    }

    this.quickPick.items = items
  }

  busy() {
    this.busyCounter++
    this.quickPick.busy = true
  }

  unbusy() {
    this.busyCounter--
    this.quickPick.busy = this.busyCounter !== 0
  }
}

export async function showChangeHashQuickPick(project: Project) {
  const controller = new ChangeHashQuickPickController(project)
  await controller.show()
}
