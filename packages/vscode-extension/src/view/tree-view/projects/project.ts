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

import { ThemeIcon, TreeItem, TreeItemCollapsibleState } from 'vscode'

import { TreeNodeDataProvider, TreeNode } from '..'
import Project from '../../../core/project'
import settings from '../../../settings'

export interface ProjectCollapsibleNode {
  type: 'project-collapsible'
  data: Project
}

export class ProjectCollapsibleNodeDataProvider implements TreeNodeDataProvider<ProjectCollapsibleNode> {
  readonly type = 'project-collapsible'

  getTreeItem(node: ProjectCollapsibleNode) {
    const project = node.data

    const item = new TreeItem(project.id, TreeItemCollapsibleState.Expanded)
    item.iconPath = new ThemeIcon('git-branch')
    item.contextValue = 'project'
    return item
  }

  getChildren(node: ProjectCollapsibleNode): TreeNode[] {
    const project = node.data
    const currentHashName = project.activatedHash?.name ?? settings.project.hash[project.id]

    return [
      ...(currentHashName
        ? [
            {
              type: 'commits-selection' as const,
              data: {
                currentHashName,
                project: project,
              },
            },
          ]
        : []),
      {
        type: 'root-path-selection',
        data: project,
      },
      ...(project.missingCommit
        ? [
            {
              type: 'text' as const,
              data: {
                text: 'WARNING: missing commit in local',
                description: 'run "git fetch" maybe fix this.',
                tooltip: 'Missing commit in local.',
                icon: 'warning',
              },
            },
          ]
        : []),
      ...(project.isError
        ? [
            {
              type: 'text' as const,
              data: {
                text: 'Error loading project: ' + project.errorMessage,
              },
            },
          ]
        : [
            {
              type: 'profiles-collapsible' as const,
              data: project,
            },
          ]),
    ]
  }
}
