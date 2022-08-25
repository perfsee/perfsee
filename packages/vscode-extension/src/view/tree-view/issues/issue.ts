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

import path from 'path'

import { Position, ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'

import { TreeNodeDataProvider } from '..'
import { Commands } from '../../../constants'
import Issue from '../../../core/issue'
import { formatTime } from '../../../utils/format-time'
import { createTreeViewItemCommand } from '../../commands'
import { DefinedDecorationUris } from '../../file-decoration-provider'

export interface IssueNode {
  type: 'issue'
  data: Issue
}

export class IssueNodeDataProvider implements TreeNodeDataProvider<IssueNode> {
  readonly type = 'issue'
  getTreeItem(node: IssueNode) {
    const sourceIssue = node.data
    const formatted = formatTime(sourceIssue.avgDuration)
    const time = formatted.value + formatted.unit
    const shortfile = sourceIssue.file.match(/([^/]+)?(\/)?[^/]*$/g)?.[0]

    const item = new TreeItem(
      `[${sourceIssue.code}] ${shortfile} ${sourceIssue.name} Ln ${sourceIssue.line}, Col ${sourceIssue.col}`,
      TreeItemCollapsibleState.None,
    )
    item.iconPath = new ThemeIcon('issues')

    item.command = createTreeViewItemCommand('open file', Commands.Open, {
      fileUri: Uri.file(path.resolve(sourceIssue.project.root, sourceIssue.file)),
      position: new Position(sourceIssue.line - 1, sourceIssue.col - 1),
      gitRoot: sourceIssue.project.gitRoot,
      commitHash: sourceIssue.lastestCommitHash,
      showHistory: true,
    })
    item.tooltip = sourceIssue.file
    item.contextValue = 'issue'
    item.description =
      sourceIssue.samples.length === 1 ? `${time}, 1 sample` : `avg ${time}, ${sourceIssue.samples.length} samples`
    item.resourceUri = sourceIssue.isSource ? undefined : DefinedDecorationUris.second
    return item
  }

  getParent(node: IssueNode) {
    return {
      type: 'project-issues-collapsible' as const,
      data: node.data.project,
    }
  }
}
