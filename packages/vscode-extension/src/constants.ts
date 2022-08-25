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

import { DocumentSelector, Position, Uri, ViewColumn } from 'vscode'

import { CallDetail } from './core/profile'
import { IssueNode } from './view/tree-view/issues/issue'
import { ProfileCallDetailNode } from './view/tree-view/performance/profile-call-detail'
import { ProfileStatsNode } from './view/tree-view/performance/profile-stats'
import { ProfileNode } from './view/tree-view/projects/profile'

export enum Colors {
  TrailingLineBackgroundColor = 'perfsee.trailingLineBackgroundColor',
  TrailingLineForegroundColor = 'perfsee.trailingLineForegroundColor',
  SlowerColor = 'perfsee.slower',
  SlowColor = 'perfsee.slow',
  MediumColor = 'perfsee.medium',
  Second = 'descriptionForeground',
}

export enum Commands {
  Open = 'perfsee.open',
  OpenIssue = 'perfsee.openIssue',
  Refresh = 'perfsee.refresh',
  TogglePerformance = 'perfsee.togglePerformance',
  ChangeHash = 'perfsee.ChangeHash',
  ChangeRoot = 'perfsee.changeRoot',
  OpenStatsNode = 'perfsee.openStatsNode',
  OpenFlamechart = 'perfsee.openFlamechart',
  HiddenProfile = 'perfsee.hiddenProfile',
  ShowProfile = 'perfsee.showProfile',
  Login = 'perfsee.login',
}

export interface CommandHanlderMap {
  [Commands.Open]: (options: {
    fileUri: Uri | string
    position?: Position | { character: number; line: number }
    gitRoot?: string
    commitHash?: string
    showHistory?: boolean
    column?: ViewColumn
  }) => void
  [Commands.OpenIssue]: (projectId: string, issueFrameKey: string) => void
  [Commands.Refresh]: () => void
  [Commands.TogglePerformance]: () => void
  [Commands.ChangeHash]: (projectId: string) => void
  [Commands.ChangeRoot]: (projectId: string) => void
  [Commands.OpenStatsNode]: (node: ProfileStatsNode) => void
  [Commands.OpenFlamechart]: (
    options:
      | ProfileNode
      | IssueNode
      | ProfileCallDetailNode
      | { callDetail: CallDetail }
      | { reportId: number; focus?: { key: string } },
  ) => void
  [Commands.HiddenProfile]: (node: ProfileNode) => void
  [Commands.ShowProfile]: (node: ProfileNode) => void
  [Commands.Login]: () => void
}

export enum Texts {
  CallDetailsShowBtn = '$(eye-closed) Performance',
  CallDetailsHideBtn = '$(eye) Performance',
  VersionSelectorBtn = 'Perfsee: ',
  SlowerEmoji = '🐢',
  SlowEmoji = '⏱',
  MediumEmoji = '⏱',
  FastEmoji = '⏱',
  FasterEmoji = '⏱',
  GoodEmoji = '👍',
  BadEmoji = '👎',
}

export enum ContextValue {
  IssuesViewWelcome = 'perfsee:issuesViewsWelcome',
  ProjectsViewWelcome = 'perfsee:projectsViewsWelcome',
  PerformanceViewWelcome = 'perfsee:performanceViewsWelcome',
}

export const ExtensionId = 'perfsee.perfsee-vscode'

export const AuthenticationProviderId = 'perfsee'

export const SupportedDocumentSelector: DocumentSelector = [
  'javascript',
  'javascriptreact',
  'jsx',
  'typescript',
  'typescriptreact',
]
