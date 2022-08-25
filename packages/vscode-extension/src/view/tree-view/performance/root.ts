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
import { commands, EventEmitter, workspace } from 'vscode'

import { TreeNodeDataProvider, RootNode, TreeNode } from '..'
import { ContextValue } from '../../../constants'
import app from '../../../core'
import Profile, { StatsNode } from '../../../core/profile'
import { CanceledError } from '../../../utils/async'
import { formatTimeToDecorationUri } from '../../../utils/format-time'

export class PerformanceRootNodeDataProvider implements TreeNodeDataProvider<RootNode> {
  onDidReadyEventEmitter = new EventEmitter<void>()
  currentStats: StatsNode[] | null = null

  get isReady() {
    return this.currentStats === null
  }

  get onDidChangeTreeData() {
    return app.onBeforeProjectsUpdateEvent
  }

  get onDidReady() {
    return this.onDidReadyEventEmitter.event
  }

  findStats(fsPath: string, baseStats: StatsNode[] = this.currentStats ?? []): StatsNode | null {
    for (const node of baseStats) {
      if (fsPath === node.fsPath) return node
      if (fsPath.startsWith(node.fsPath)) {
        return this.findStats(fsPath, node.children)
      }
    }
    return null
  }

  async getChildren(): Promise<TreeNode[]> {
    try {
      const oldStats = this.currentStats
      this.currentStats = null
      const projects = await app.projectsPromise
      if (projects.length > 0) {
        const profiles = projects.reduce<Profile[]>((profiles, project) => {
          if (project.isError || !project.profiles || project.profiles.length === 0) return profiles

          for (const pendingProfile of project.profiles) {
            if (pendingProfile.filtered) {
              continue
            }

            profiles.push(pendingProfile)
          }
          return profiles
        }, [])

        const stats = Profile.memoizeStatsAll(
          profiles,
          workspace.workspaceFolders?.[0]?.uri?.fsPath ?? projects[0].root,
        )

        const maxDuration = Math.max(...stats.map((stat) => stat.duration))

        if (stats.length !== 0) {
          this.currentStats = stats
          if (oldStats === null) setImmediate(() => this.onDidReadyEventEmitter.fire())
          return stats
            .sort((a, b) => b.duration - a.duration)
            .map((child) => ({
              type: 'profile-stats-node' as const,
              data: {
                stats: child,
                resourceUri: formatTimeToDecorationUri(child.duration, Math.max(maxDuration, 10000)),
              },
            }))
        } else {
          await commands.executeCommand('setContext', ContextValue.PerformanceViewWelcome, null)
          return []
        }
      } else {
        await commands.executeCommand('setContext', ContextValue.PerformanceViewWelcome, 'noProject')
        return []
      }
    } catch (err) {
      if (err instanceof CanceledError) {
        await commands.executeCommand('setContext', ContextValue.PerformanceViewWelcome, null)
        return []
      }

      if (err instanceof UnauthorizedError) {
        await commands.executeCommand('setContext', ContextValue.PerformanceViewWelcome, 'login')
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
