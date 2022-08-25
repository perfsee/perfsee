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

export interface ProjectIssuesCollapsibleNode {
  type: 'project-issues-collapsible'
  data: Project
}

export class ProjectIssuesCollapsibleNodeDataProvider implements TreeNodeDataProvider<ProjectIssuesCollapsibleNode> {
  readonly type = 'project-issues-collapsible'

  getTreeItem(node: ProjectIssuesCollapsibleNode) {
    const project = node.data

    const item = new TreeItem(project.id, TreeItemCollapsibleState.Expanded)
    item.iconPath = new ThemeIcon('git-branch')
    item.contextValue = 'project'
    return item
  }

  getChildren(node: ProjectIssuesCollapsibleNode): TreeNode[] {
    const project = node.data

    if (project.isError) {
      return [
        {
          type: 'text',
          data: {
            text: 'Error loading project: ' + project.errorMessage,
          },
        },
      ]
    }
    return [
      ...(project.missingCommit
        ? [
            {
              type: 'text' as const,
              data: {
                text: 'WARNING: missing commit in local',
                description: 'run "git fetch" maybe fix this.',
                tooltip: 'Missing commit in local.',
              },
            },
          ]
        : []),
      ...(!project.sourceIssues || project.sourceIssues.length === 0
        ? [
            {
              type: 'text' as const,
              data: {
                text: `No issue with current version`,
              },
            },
          ]
        : [
            ...project.sourceIssues
              .sort((a, b) => (a.isSource ? -1 : b.isSource ? 1 : -1))
              .map((sourceIssue) => ({
                type: 'issue' as const,
                data: sourceIssue,
              })),
          ]),
    ]
  }
}
