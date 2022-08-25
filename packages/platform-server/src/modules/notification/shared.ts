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

import {
  Artifact,
  BundleMessageFilter,
  BundleMessageSource,
  LabMessageSource,
  MessageTargetType,
  Setting,
  Snapshot,
  User,
} from '@perfsee/platform-server/db'

export function shouldSendBundleJobMessage(setting: Setting, artifact: Artifact, hasWarning: boolean) {
  let sourceMatch = false
  switch (setting.bundleMessageSource) {
    case BundleMessageSource.All:
      sourceMatch = true
      break
    case BundleMessageSource.Branch:
      sourceMatch = setting.bundleMessageBranches.includes(artifact.branch)
      break
  }
  let filterPass = false

  switch (setting.bundleMessageFilter) {
    case BundleMessageFilter.All:
      filterPass = true
      break
    case BundleMessageFilter.Warning:
      filterPass = hasWarning
      break
    case BundleMessageFilter.None:
      filterPass = false
      break
  }

  return sourceMatch && filterPass
}

export function shouldSendJobMessage(setting: Setting) {
  switch (setting.labMessageSource) {
    case LabMessageSource.All:
      return true
    case LabMessageSource.Warning:
      // to be implemented
      return false
    case LabMessageSource.None:
      return false
  }
}

export function getBundleJobMessageTargets(
  setting: Setting,
  artifact: Artifact,
  hasWarning: boolean,
): { emails?: string[] } {
  if (shouldSendBundleJobMessage(setting, artifact, hasWarning)) {
    switch (setting.messageTargetType) {
      case MessageTargetType.Issuer:
        return { emails: artifact.issuer ? [artifact.issuer] : [] }
      case MessageTargetType.Specified:
        return { emails: setting.messageTarget.userEmails }
    }
  }

  return {}
}

export function getLabJobMessageTargets(snapshot: Snapshot, setting: Setting): { emails?: string[] } {
  if (shouldSendJobMessage(setting)) {
    switch (setting.messageTargetType) {
      case MessageTargetType.Issuer:
        return { emails: snapshot.issuer ? [snapshot.issuer] : [] }
      case MessageTargetType.Specified:
        return { emails: setting.messageTarget.userEmails }
    }
  }

  return {}
}

export function getCookieMessageTargets(setting: Setting, projectOwners: User[]): { emails?: string[] } {
  if (shouldSendJobMessage(setting)) {
    switch (setting.messageTargetType) {
      case MessageTargetType.Issuer:
        const owners = projectOwners
        return { emails: owners.map(({ email }) => email) }
      case MessageTargetType.Specified:
        return { emails: setting.messageTarget.userEmails }
    }
  }

  return {}
}

const unit = ['ms', 'sec', 'min'] as const

export const formatTime = (time: number) => {
  let unitIndex = 0
  if (time > 1000) {
    time /= 1000
    unitIndex += 1
    if (time > 60) {
      time /= 60
      unitIndex += 1
    }
  }
  return `${Number.isInteger(time) ? time.toString() : time.toFixed(2)}${unit[unitIndex]}`
}
