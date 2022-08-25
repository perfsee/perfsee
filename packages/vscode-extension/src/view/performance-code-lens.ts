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

import { groupBy } from 'lodash'
import {
  CancellationToken,
  CodeLens,
  CodeLensProvider,
  commands,
  DocumentSymbol,
  TextDocument,
  workspace,
  Range,
  EventEmitter,
} from 'vscode'

import { Commands } from '../constants'
import app from '../core'
import Profile from '../core/profile'
import { findSymbol } from '../utils/document-symbol'
import { formatTime, formatTimeToEmoji } from '../utils/format-time'
import Logger from '../utils/logger'

export class PerfseePerformanceCodeLensProvider implements CodeLensProvider {
  readonly onDidChangeCodeLensesEmitter = new EventEmitter<void>()
  get onDidChangeCodeLenses() {
    return this.onDidChangeCodeLensesEmitter.event
  }
  private isEnable = true

  constructor() {
    app.onDidProjectsUpdateEvent(() => {
      this.onDidChangeCodeLensesEmitter.fire()
    })
  }

  enable() {
    this.isEnable = true
    this.onDidChangeCodeLensesEmitter.fire()
  }

  disable() {
    this.isEnable = false
    this.onDidChangeCodeLensesEmitter.fire()
  }

  async provideCodeLenses(document: TextDocument, _: CancellationToken): Promise<CodeLens[]> {
    if (!this.isEnable) {
      return []
    }

    Logger.debug(`[PerformanceCodeLensProvider] render codelens for ${document.uri}`)

    // skip large document
    if (document.lineCount > 20000 || (await workspace.fs.stat(document.uri)).size > 50000) {
      Logger.debug('[CallDetails] skip document, because too long.')
      return []
    }

    let fileCommitHash
    if (document.uri.scheme === 'gitlens') {
      fileCommitHash = document.uri.authority
    }

    const absoluteFilePath = path.normalize(document.uri.fsPath)

    const profiles = Array.from(app.getProfilesByFilePath(absoluteFilePath, fileCommitHash))

    const callDetails = await Profile.findCallDetailsByDocument(profiles, document, true)

    // if no call details found
    if (!callDetails || callDetails.length === 0) return []

    const symbols: DocumentSymbol[] | undefined = await commands.executeCommand(
      'vscode.executeDocumentSymbolProvider',
      document.uri,
    )

    const codeLens: CodeLens[] = []

    for (const callDetail of callDetails) {
      const symbol = symbols ? findSymbol(symbols, callDetail.position) : undefined

      const totalTime = callDetail.samples.reduce((prev, current) => prev + current.totalWeight, 0)

      const groupedSimples = Object.values(groupBy(callDetail.samples, (sample) => sample.profile.reportId))

      // the longest cumulative called time in a single profile
      const maxProfileTime = Math.max(
        ...groupedSimples.map((samples) => samples.reduce((prev, current) => prev + current.totalWeight, 0)),
      )

      const avgTime = totalTime / callDetail.samples.length

      const formatedTotalTime = formatTime(totalTime)
      const formatedAvgTime = formatTime(avgTime)

      const formatedEmoji = formatTimeToEmoji(maxProfileTime)

      const contentText =
        callDetail.samples.length === 1
          ? `${formatedEmoji} 1 sample, ${formatedTotalTime.value}${formatedTotalTime.unit}${
              symbol ? `, at ${symbol.name}` : ''
            }`
          : `${formatedEmoji} ${callDetail.samples.length} samples, avg ${formatedAvgTime.value}${
              formatedAvgTime.unit
            }, total ${formatedTotalTime.value}${formatedTotalTime.unit}${symbol ? `, at ${symbol.name}` : ''}`

      codeLens.push(
        new CodeLens(new Range(callDetail.position.line, 0, callDetail.position.line, 0), {
          title: contentText,
          command: Commands.OpenFlamechart,
          arguments: [{ callDetail }],
        }),
      )
    }

    return codeLens
  }
}
