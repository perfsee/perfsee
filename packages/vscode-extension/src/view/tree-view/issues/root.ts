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

import { UnauthorizedError } from 'perfsee-vscode/api/api-client'
import { commands } from 'vscode'

import { TreeNodeDataProvider, RootNode, TreeNode } from '..'
import { ContextValue } from '../../../constants'
import app from '../../../core'
import { CanceledError } from '../../../utils/async'

export class ProjectIssuesRootNodeDataProvider implements TreeNodeDataProvider<RootNode> {
  get onDidChangeTreeData() {
    return app.onBeforeProjectsUpdateEvent
  }

  async getChildren(): Promise<TreeNode[]> {
    try {
      const projects = await app.projectsPromise
      if (projects.length >= 1) {
        return projects.map((project) => ({
          type: 'project-issues-collapsible',
          data: project,
        }))
      } else {
        await commands.executeCommand('setContext', ContextValue.IssuesViewWelcome, 'noProject')
        return []
      }
    } catch (err) {
      if (err instanceof CanceledError) {
        return app.projects.map((project) => ({
          type: 'project-issues-collapsible',
          data: project,
        }))
      }

      if (err instanceof UnauthorizedError) {
        await commands.executeCommand('setContext', ContextValue.IssuesViewWelcome, 'login')
        return []
      }

      return [
        {
          type: 'text',
          data: {
            text: 'Error loading projects: ' + (err instanceof Error ? err.message : `${err}`),
          },
        },
      ]
    }
  }
}
