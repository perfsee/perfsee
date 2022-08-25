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

import { debounce } from 'lodash'
import {
  window,
  Selection,
  Range,
  commands,
  ExtensionContext,
  Position,
  TextEditorRevealType,
  workspace,
  languages,
  authentication,
  Uri,
  StatusBarAlignment,
  TextDocument,
  ViewColumn,
} from 'vscode'

import { AuthenticationProviderId, Commands, SupportedDocumentSelector, Texts } from './constants'
import app from './core'
import Profile, { CallSample } from './core/profile'
import settings, {
  insertSessionFilteredProfile,
  onDidSettingsUpdated,
  reloadSettings,
  removeSessionFilteredProfile,
  updateSessionPerformance,
} from './settings'
import { clearAllMemoizeCache } from './utils/cache'
import { diffPosition } from './utils/diff-position'
import { formatScoreToEmoji, formatTime } from './utils/format-time'
import { memoizeReadFileFromCommit } from './utils/git'
import { checkGitLensInstall, toGitLensRevisionUri } from './utils/gitlens'
import Logger from './utils/logger'
import { startRepoWatcher } from './utils/repo-watcher'
import { PerfseeAuthenticationProvider, uriHandler as authenticationUriHandler } from './view/authentication'
import { showChangeRootQuickPick } from './view/change-root'
import { showChangeHashQuickPick } from './view/change-version'
import { registerCommand } from './view/commands'
import { PerfseeVirtualFileSystemFileDecorationProvider } from './view/file-decoration-provider'
import { PerfseeFileSystemProvider } from './view/filesystem'
import { PerfseePerformanceCodeLensProvider } from './view/performance-code-lens'
import { IssuesTreeViewController, PerformanceTreeViewController, ProjectsTreeViewController } from './view/tree-view'
import { HashNotification } from './view/version-notification'
import FlamechartWebViewController from './view/webview'

export function activate(context: ExtensionContext) {
  // init
  Logger.info('Perfsee vscode activated with settings.', settings)
  if (settings.autoRefresh) {
    context.subscriptions.push(
      startRepoWatcher(
        debounce(() => {
          app
            .scanProjectsOnRepositoriesChanged()
            .then((changed) => {
              if (changed) {
                Logger.debug('[app] git repo changed, start rescan projects.')
              }
            })
            .catch((err) => Logger.err(err))
        }, 500),
      ),
    )
  }
  app.scanProjects()
  Logger.debug('[app] start scan projects.')

  // version change notification
  context.subscriptions.push(HashNotification())

  // virtual filesystem
  context.subscriptions.push(
    workspace.registerFileSystemProvider('perfsee', new PerfseeFileSystemProvider(), { isReadonly: true }),
  )
  context.subscriptions.push(
    window.registerFileDecorationProvider(new PerfseeVirtualFileSystemFileDecorationProvider()),
  )

  // authentication
  context.subscriptions.push(window.registerUriHandler(authenticationUriHandler))
  const authenticationProvider = new PerfseeAuthenticationProvider(context.secrets)
  context.subscriptions.push(
    authentication.registerAuthenticationProvider(AuthenticationProviderId, 'Perfsee', authenticationProvider, {
      supportsMultipleAccounts: false,
    }),
  )
  context.subscriptions.push(
    authentication.onDidChangeSessions((e) => {
      if (e.provider.id === AuthenticationProviderId) {
        app.scanProjects()
      }
    }),
  )

  // codelens
  const performanceCodeLensProvider = new PerfseePerformanceCodeLensProvider()
  context.subscriptions.push(
    languages.registerCodeLensProvider(
      // https://code.visualstudio.com/docs/languages/identifiers
      SupportedDocumentSelector,
      performanceCodeLensProvider,
    ),
  )

  // watch settings change
  context.subscriptions.push(
    workspace.onDidChangeConfiguration(() => {
      reloadSettings()
    }),
  )
  context.subscriptions.push(
    onDidSettingsUpdated(() => {
      Logger.info('[app] settings updated.')
      app.scanProjects()
    }),
  )

  // status bar
  const callDetailsStatusBarBtn = window.createStatusBarItem(StatusBarAlignment.Right)
  callDetailsStatusBarBtn.command = Commands.TogglePerformance
  callDetailsStatusBarBtn.show()
  const updateCallDetails = () => {
    if (settings.performance) {
      performanceCodeLensProvider.enable()
      callDetailsStatusBarBtn.text = Texts.CallDetailsHideBtn
    } else {
      performanceCodeLensProvider.disable()
      callDetailsStatusBarBtn.text = Texts.CallDetailsShowBtn
    }
  }
  updateCallDetails()
  context.subscriptions.push(onDidSettingsUpdated(updateCallDetails), callDetailsStatusBarBtn)

  // treeview
  const projectsTreeView = new ProjectsTreeViewController('perfseeProjects')
  const issuesTreeView = new IssuesTreeViewController('perfseeIssues')
  const performanceTreeView = new PerformanceTreeViewController('perfseePerformance')
  context.subscriptions.push(projectsTreeView, issuesTreeView, performanceTreeView)

  const focusActiveDocument = () => {
    if (!performanceTreeView.treeView.visible) {
      return
    }
    const targetUri = window.activeTextEditor?.document.uri
    if (targetUri?.scheme === 'file' || targetUri?.scheme === 'gitlens') {
      performanceTreeView.reveal(targetUri)
    }
  }

  performanceTreeView.onReady(focusActiveDocument)
  performanceTreeView.treeView.onDidChangeVisibility(focusActiveDocument)
  window.onDidChangeActiveTextEditor(focusActiveDocument)

  // webview
  const flamechartWebViewController = new FlamechartWebViewController(context.extensionPath)
  context.subscriptions.push(flamechartWebViewController)

  // commands
  context.subscriptions.push(
    registerCommand(Commands.Open, async (options) => {
      if (!options) {
        Logger.debug(`Commamd ${Commands.Open} called with wrong parameter type.`)
        return
      }
      try {
        let { fileUri, position } = options
        const { gitRoot, commitHash, showHistory, column = ViewColumn.Active } = options
        if (typeof fileUri === 'string') fileUri = Uri.parse(fileUri)
        if (position && !(position instanceof Position)) position = new Position(position.line, position.character)
        let openUri = fileUri
        let document: TextDocument

        if (gitRoot && commitHash) {
          let historySource
          try {
            historySource = await memoizeReadFileFromCommit({
              dir: gitRoot,
              filepath: fileUri.fsPath,
              commitHash,
            })
          } catch (err) {
            Logger.debug("can't find source from commit: " + fileUri.fsPath)
          }
          if (historySource && showHistory && checkGitLensInstall()) {
            openUri = toGitLensRevisionUri(commitHash, fileUri.fsPath, gitRoot)
            document = await workspace.openTextDocument(openUri)
          } else {
            document = await workspace.openTextDocument(openUri)
            if (position) {
              const source = document.getText()
              position = historySource
                ? diffPosition(historySource, source, position as Position) ?? position
                : position
            }
          }
        } else {
          document = await workspace.openTextDocument(openUri)
        }

        const editor = await window.showTextDocument(document, column)
        if (position) {
          editor.selection = new Selection(position as Position, position as Position)
          editor.revealRange(new Range(position as Position, position as Position), TextEditorRevealType.InCenter)
        }
      } catch (err) {
        await window.showErrorMessage(`${err}`)
      }
    }),
    registerCommand(Commands.OpenIssue, async (projectId, issueFrameKey) => {
      if (typeof projectId !== 'string' || typeof issueFrameKey !== 'string') {
        Logger.debug(`Commamd ${Commands.OpenIssue} called with wrong parameter type.`)
        return
      }

      // find the issue
      const issue = app.projects
        .find((project) => project.id === projectId)
        ?.sourceIssues?.find((issue) => issue.key === issueFrameKey)

      // reveal in tree view
      if (issue) {
        issuesTreeView.reveal(issue)
      } else {
        await window.showErrorMessage('Issue not found.')
      }
    }),
    registerCommand(Commands.Refresh, () => {
      clearAllMemoizeCache()
      app.scanProjects()
      return app.projectsPromise
        .then(() => undefined)
        .catch(() => {
          return
        })
    }),
    registerCommand(Commands.TogglePerformance, () => {
      updateSessionPerformance(!settings.performance)
    }),
    registerCommand(Commands.ChangeHash, (projectId) => {
      const project = app.projects.find((project) => project.id === projectId)
      if (!project) {
        void window.showErrorMessage('Project not found. projectId: ' + projectId)
        return
      }
      showChangeHashQuickPick(project).catch((err) => {
        Logger.err('showChangeHashQuickPick error: ', err)
      })
    }),
    registerCommand(Commands.ChangeRoot, (projectId) => {
      const project = app.projects.find((project) => project.id === projectId)
      if (!project) {
        void window.showErrorMessage('Project not found. projectId: ' + projectId)
        return
      }
      showChangeRootQuickPick(project)
    }),
    registerCommand(Commands.OpenStatsNode, (node) => {
      if (!node) {
        Logger.debug(`Commamd ${Commands.OpenIssue} called with wrong parameter type.`)
        return
      }

      return commands.executeCommand(Commands.Open, { fileUri: Uri.file(node.data.stats.fsPath) })
    }),
    registerCommand(Commands.OpenFlamechart, async (options) => {
      if (!options) {
        Logger.debug(`Commamd ${Commands.OpenIssue} called with wrong parameter type.`)
        return
      }

      let profile: Profile | undefined | null = null
      let focus: { key: string } | undefined

      if ('type' in options && (options.type === 'profile' || options.type === 'filtered-profile')) {
        profile = options.data
      } else {
        let reportId
        if ('type' in options && options.type === 'issue') {
          reportId = options.data.lastestSample.snapshotReportId
          focus = { key: options.data.key }
        } else if (('type' in options && options.type === 'profile-call-detail') || 'callDetail' in options) {
          const callDetail = 'callDetail' in options ? options.callDetail : options.data.callDetail
          const profilesCountMap: {
            [reportId: number]: { samples: CallSample[]; key: string; profile: Profile }
          } = {}

          for (const sample of callDetail.samples) {
            const reportId = sample.profile.reportId
            if (profilesCountMap[reportId]) {
              profilesCountMap[reportId].samples.push(sample)
            } else {
              profilesCountMap[reportId] = {
                samples: [sample],
                key: String(sample.raw.node.frame.key),
                profile: sample.profile,
              }
            }
          }

          const choices = Object.values(profilesCountMap)

          if (choices.length === 0) {
            void window.showErrorMessage('Open flamechart failed. Profile not found.')
            return
          }

          if (choices.length === 1) {
            reportId = choices[0].profile.reportId
            focus = { key: choices[0].key }
          } else {
            const quickPick = choices
              .sort((a, b) => b.samples.length - a.samples.length)
              .map(({ samples, profile, key }) => {
                const scoreStr = profile.score ? `${formatScoreToEmoji(profile.score)} ${profile.score}` : ''
                const totalWeight = samples.reduce((prev, current) => prev + current.totalWeight, 0)
                const formattedTotalTime = formatTime(totalWeight)
                const totalTimeText = `${formattedTotalTime.value} ${formattedTotalTime.unit}`

                const avgWeight = totalWeight / samples.length
                const formattedAvgTime = formatTime(avgWeight)
                const avgTimeText = `${formattedAvgTime.value} ${formattedAvgTime.unit}`

                const samplesText =
                  samples.length === 1
                    ? `1 sample, ${totalTimeText}`
                    : `${samples.length} samples, avg ${avgTimeText}, total ${totalTimeText}`
                return {
                  label: `$(preview) ${profile.page.name} · ${profile.environment.name} · ${profile.profile.name}  ${scoreStr}`,
                  detail: `${samplesText}`,
                  description: `$(source-control) ${profile.project.id}`,
                  profile: profile,
                  key,
                }
              })

            const pick = await window.showQuickPick(quickPick, {
              placeHolder: 'Please choose a Profile.',
            })
            if (pick) {
              reportId = pick.profile.reportId
              focus = { key: pick.key }
            } else {
              Logger.debug('Quick Pick canceled.')
              return
            }
          }
        } else if ('reportId' in options && 'focus' in options) {
          reportId = options.reportId
          focus = options.focus
        }
        for (const project of app.projects) {
          for (const item of project.profiles ?? []) {
            if (item.reportId === reportId) {
              profile = item
              break
            }
          }
          if (profile) break
        }
      }

      if (profile == null) {
        void window.showErrorMessage('Open flamechart failed. Profile not found.')
        return
      }
      return flamechartWebViewController.open(profile, focus)
    }),
    registerCommand(Commands.ShowProfile, (node) => {
      if (!node) {
        return
      }

      const profileId = node.data.reportId
      removeSessionFilteredProfile(profileId)
    }),
    registerCommand(Commands.HiddenProfile, (node) => {
      if (!node) {
        return
      }

      const profileId = node.data.reportId
      insertSessionFilteredProfile(profileId)
    }),
    commands.registerCommand(Commands.Login, async () => {
      const exsitedSession = await authentication.getSession(AuthenticationProviderId, ['all'], {})
      if (exsitedSession) {
        void authentication.getSession(AuthenticationProviderId, ['all'], { forceNewSession: true })
      } else {
        void authentication.getSession(AuthenticationProviderId, ['all'], { createIfNone: true })
      }
    }),
  )
}

export function deactivate() {}
