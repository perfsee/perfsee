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

import {
  commands,
  DocumentSymbol,
  TextDocument,
  ThemeIcon,
  TreeItem,
  TreeItemCollapsibleState,
  Uri,
  workspace,
} from 'vscode'

import { TreeNode, TreeNodeDataProvider } from '../'
import app from '../../../core'
import Profile, { StatsNode } from '../../../core/profile'
import { formatTime, formatTimeToDecorationUri } from '../../../utils/format-time'
import Logger from '../../../utils/logger'

export interface ProfileStatsNode {
  type: 'profile-stats-node'
  data: {
    stats: StatsNode
    resourceUri?: Uri
  }
}

export class ProfileStatsNodeDataProvider implements TreeNodeDataProvider<ProfileStatsNode> {
  readonly type = 'profile-stats-node'
  getTreeItem(node: ProfileStatsNode) {
    const formatted = formatTime(node.data.stats.duration)
    const time = formatted.value + formatted.unit

    const item = new TreeItem(`${node.data.stats.name}`, TreeItemCollapsibleState.Collapsed)
    item.contextValue = node.data.stats.children.length > 0 ? 'profile-stats-node(folder)' : 'profile-stats-node(file)'
    item.description = time
    item.resourceUri = node.data.resourceUri
    item.iconPath = node.data.stats.children.length > 0 ? ThemeIcon.Folder : new ThemeIcon('file')
    return item
  }

  async getChildren(node: ProfileStatsNode): Promise<TreeNode[]> {
    const stats = node.data.stats

    if (stats.children.length > 0) {
      const maxDuration = Math.max(...stats.children.map((stat) => stat.duration))
      return stats.children
        .sort((a, b) => b.duration - a.duration)
        .map((child) => ({
          type: 'profile-stats-node' as const,
          data: {
            stats: child,
            resourceUri: formatTimeToDecorationUri(child.duration, Math.max(maxDuration, 10000)),
          },
        }))
    }

    let diffLine = false
    let symbols: DocumentSymbol[] | undefined | null
    let document: TextDocument | undefined | null

    const fileUri = Uri.file(stats.fsPath)

    try {
      document = await workspace.openTextDocument(fileUri)

      // skip large document
      if (document.lineCount <= 20000 && (await workspace.fs.stat(document.uri)).size < 50000) {
        symbols = await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)
        diffLine = true
      }
    } catch (err) {
      Logger.debug(err)
    }

    const profiles = Array.from(app.getProfilesByFilePath(stats.fsPath))
    const callDetails = await Profile.findCallDetailsByDocument(profiles, document ?? stats.fsPath, diffLine)

    if (!callDetails || callDetails.length === 0) return []

    const sortedCallDetails = callDetails
      .map((detail) => ({
        ...detail,
        totalTime: detail.samples.reduce((prev, current) => prev + current.totalWeight, 0),
      }))
      .sort((a, b) => b.totalTime - a.totalTime)

    const children = []

    for (const callDetail of sortedCallDetails) {
      if (!callDetail.position) continue

      children.push({
        type: 'profile-call-detail' as const,
        data: {
          symbols,
          callDetail,
          fileUri,
        },
      })
    }

    return children
  }

  getParent(node: ProfileStatsNode) {
    if (node.data.stats.parent) {
      return {
        type: 'profile-stats-node' as const,
        data: {
          stats: node.data.stats.parent,
        },
      }
    } else {
      return undefined
    }
  }
}
