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

import { Disposable, Position, Uri, ViewColumn, WebviewPanel, window } from 'vscode'

import { Commands } from '../constants'
import Profile from '../core/profile'
import { WebViewProps } from '../types/webview'
import { formatScoreToEmoji } from '../utils/format-time'
import Logger from '../utils/logger'
import parseFrameKey from '../utils/parse-frame-key'

import { executeCommand } from './commands'

export default class FlamechartWebViewController extends Disposable {
  activedWebviewPanel: WebviewPanel | null = null
  activedProfile: Profile | null = null

  constructor(private readonly extensionPath: string) {
    super(() => {
      this.activedWebviewPanel?.dispose()
    })
  }

  async open(profile: Profile, focus?: WebViewProps['focus']) {
    if (this.activedWebviewPanel == null) await this.openWebviewPanel()
    const prevProfile = this.activedProfile
    this.activedProfile = null
    const scoreStr = profile.score ? `${formatScoreToEmoji(profile.score)} ${profile.score}` : ''
    if (this.activedWebviewPanel)
      this.activedWebviewPanel.title = `Flamechart · ${profile.page.name} · ${profile.environment.name} · ${profile.profile.name}  ${scoreStr}`

    let metrics
    try {
      metrics = await profile.memoizeGetMetrics()
    } catch (error) {
      Logger.err('Get flamechart metrics error.')
    }

    await this.activedWebviewPanel?.webview.postMessage({
      type: 'update-props',
      payload: { data: prevProfile === profile ? 'prev' : profile.rawData, focus, metrics } as WebViewProps,
    })
    this.activedWebviewPanel?.reveal(undefined, true)
    this.activedProfile = profile
  }

  async openWebviewPanel() {
    const webviewPanel = window.createWebviewPanel(
      'perfsee-flamechart',
      'Flamechart',
      {
        viewColumn: ViewColumn.Beside,
      },
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      },
    )

    const scriptFile = webviewPanel.webview.asWebviewUri(Uri.file(path.join(this.extensionPath, 'dist', 'webview.js')))

    webviewPanel.webview.html = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Cat Coding</title>
        <style>
          html, body, #app { margin: 0; padding: 0; height: 100%; }
        </style>
    </head>
    <body>
      <div id="app"></div>
      <script src="${scriptFile}"></script>
    </body>
    </html>`

    this.activedWebviewPanel = webviewPanel

    await new Promise<void>((resolve) => {
      const disposable = webviewPanel.webview.onDidReceiveMessage((e) => {
        if (e.type === 'ready') {
          disposable.dispose()
          resolve()
        }
      })
    })

    const disposable = Disposable.from(
      window.onDidChangeActiveColorTheme(() => {
        void webviewPanel.webview.postMessage({ type: 'did-change-active-color-theme' })
      }),
      webviewPanel.webview.onDidReceiveMessage((e) => {
        if (e.type === 'open-frame') {
          if (!this.activedProfile) return
          const frame = parseFrameKey(e.payload.key)
          const profile = this.activedProfile
          const project = this.activedProfile.project

          void executeCommand(Commands.Open, {
            fileUri: path.resolve(project.root, frame.file),
            position: new Position(frame.line - 1, frame.col - 1),
            gitRoot: project.gitRoot,
            commitHash: profile.commitHash,
            showHistory: false,
            // open file in column one, if the webview is in the column one, open it in beside.
            column: webviewPanel.viewColumn !== ViewColumn.One ? ViewColumn.One : ViewColumn.Beside,
          })
        }
      }),
    )

    webviewPanel.onDidDispose(() => {
      this.activedWebviewPanel = null
      this.activedProfile = null
      disposable.dispose()
    })
  }
}
