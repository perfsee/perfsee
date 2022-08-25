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

import { MarkdownString, TreeItem, TreeItemCollapsibleState } from 'vscode'

import { TreeNodeDataProvider } from '..'
import { Commands } from '../../../constants'
import Project from '../../../core/project'
import { createTreeViewItemCommand } from '../../commands'

export interface RootPathSelectionNode {
  type: 'root-path-selection'
  data: Project
}

export class RootPathSelectionNodeDataProvider implements TreeNodeDataProvider<RootPathSelectionNode> {
  readonly type = 'root-path-selection'
  getTreeItem(node: RootPathSelectionNode) {
    const item = new TreeItem(`Root: ${node.data.root}`, TreeItemCollapsibleState.None)
    item.description = 'click here to change root path.'
    item.tooltip = new MarkdownString(
      '**The root path of the project.**\n\nAll profile and issue paths are resolved based on this path. Click to change root path.',
    )
    item.contextValue = 'root-path-selection'
    item.command = createTreeViewItemCommand('change root', Commands.ChangeRoot, node.data.id)
    return item
  }
}
