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

import { groupBy } from 'lodash'
import { DocumentSymbol, TreeItem, TreeItemCollapsibleState, Uri } from 'vscode'

import { TreeNodeDataProvider } from '..'
import { Commands } from '../../../constants'
import { CallDetail } from '../../../core/profile'
import { findSymbol } from '../../../utils/document-symbol'
import { formatTime, formatTimeToEmoji } from '../../../utils/format-time'
import { createTreeViewItemCommand } from '../../commands'

export interface ProfileCallDetailNode {
  type: 'profile-call-detail'
  data: { symbols: DocumentSymbol[] | undefined | null; fileUri: Uri; callDetail: CallDetail }
}

export class ProfileCallDetailNodeProvider implements TreeNodeDataProvider<ProfileCallDetailNode> {
  readonly type = 'profile-call-detail'
  getTreeItem(node: ProfileCallDetailNode) {
    const symbols = node.data.symbols
    const callDetail = node.data.callDetail
    const fileUri = node.data.fileUri

    const symbol = symbols ? findSymbol(symbols, callDetail.position) : undefined

    const totalTime = callDetail.samples.reduce((prev, current) => prev + current.totalWeight, 0)

    const maxTime = Math.max(...callDetail.samples.map((sample) => sample.totalWeight))

    const groupedSimples = Object.values(groupBy(callDetail.samples, (sample) => sample.profile.reportId))

    // the longest cumulative called time in a single profile
    const maxProfileTime = Math.max(
      ...groupedSimples.map((samples) => samples.reduce((prev, current) => prev + current.totalWeight, 0)),
    )

    // the maximum number of times to be called in a single profile.
    const maxProfileCalledCount = Math.max(...groupedSimples.map((simples) => simples.length))

    const avgTime = totalTime / callDetail.samples.length

    const formatedTotalTime = formatTime(totalTime)
    const formatedAvgTime = formatTime(avgTime)

    // if it is called many times, use maxProfileTime for emoji
    const formatedEmoji = maxProfileCalledCount > 5 ? formatTimeToEmoji(maxProfileTime) : formatTimeToEmoji(maxTime)

    const contentText =
      callDetail.samples.length === 1
        ? `${formatedEmoji} 1 sample, ${formatedTotalTime.value}${formatedTotalTime.unit}${
            symbol ? `, at ${symbol.name}` : ''
          }`
        : `${formatedEmoji} ${callDetail.samples.length} samples, avg ${formatedAvgTime.value}${
            formatedAvgTime.unit
          }, total ${formatedTotalTime.value}${formatedTotalTime.unit}${
            symbol ? `, at ${symbol.name}` : callDetail.name ? `, at ${callDetail.name}` : ''
          }`

    const item = new TreeItem(contentText, TreeItemCollapsibleState.None)
    item.contextValue = 'profile-call-detail'
    item.command = createTreeViewItemCommand('Open call detail', Commands.Open, {
      fileUri,
      position: callDetail.position,
    })

    return item
  }
}
