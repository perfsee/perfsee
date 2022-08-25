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

import { ThemeIcon, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'

import { TreeNodeDataProvider } from '..'
import Profile from '../../../core/profile'
import { formatScoreToEmoji } from '../../../utils/format-time'
import { reportLink } from '../../../utils/report-link'
import { DefinedDecorationUris } from '../../file-decoration-provider'

export interface ProfileNode {
  type: 'profile' | 'filtered-profile'
  data: Profile
}

export class ProfileNodeDataProvider implements TreeNodeDataProvider<ProfileNode> {
  readonly type = 'profile'
  getTreeItem(node: ProfileNode) {
    const profile = node.data
    const scoreStr = profile.score ? `${formatScoreToEmoji(profile.score)} ${profile.score}` : ''
    const item = new TreeItem(
      `${profile.page.name} · ${profile.environment.name} · ${profile.profile.name}  ${scoreStr}`,
      TreeItemCollapsibleState.None,
    )
    item.description = `snapshot #${profile.snapshotId}`
    item.contextValue = profile.filtered ? 'filtered-profile' : 'profile'
    if (profile.filtered) {
      item.resourceUri = DefinedDecorationUris.filtered
    }
    item.iconPath = new ThemeIcon('preview')
    item.command = {
      title: 'open report',
      command: 'vscode.open',
      arguments: [Uri.parse(reportLink(profile.project.id, profile.reportId).href)],
    }
    return item
  }
}
