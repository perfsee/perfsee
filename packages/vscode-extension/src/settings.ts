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

import { merge, isEqual } from 'lodash'
import { workspace, EventEmitter } from 'vscode'

interface Settings {
  project: {
    hash: Record<number, string | undefined>
    root: Record<number, string>
  }
  filteredProfile: number[]
  url: string
  debug: boolean
  performance: boolean
  autoRefresh: boolean
}

const defaultSettings: Settings = {
  project: { hash: {}, root: {} },
  filteredProfile: [],
  url: 'https://perfsee.com',
  debug: false,
  performance: true,
  autoRefresh: true,
}

type LoopPartial<T> = {
  [P in keyof T]?: LoopPartial<T[P]>
}

const sessionSettings: LoopPartial<Settings> = {}

const settings: Settings = { ...defaultSettings }

const onDidSettingsUpdatedEventEmitter = new EventEmitter<void>()
export const onDidSettingsUpdated = onDidSettingsUpdatedEventEmitter.event

export function reloadSettings() {
  const mergedSettings = merge(
    {},
    defaultSettings,
    JSON.parse(JSON.stringify(workspace.getConfiguration().get('perfsee'))),
    sessionSettings,
  )
  if (isEqual(settings, mergedSettings)) {
    return
  }
  for (const key in settings) {
    if (Object.prototype.hasOwnProperty.call(settings, key)) {
      delete settings[key]
    }
  }
  Object.assign(settings, mergedSettings)
  if (settings.url.endsWith('/')) {
    settings.url = settings.url.replace(/\/+$/, '')
  }
  onDidSettingsUpdatedEventEmitter.fire()
}

export function updateSessionProjectHash(projectId: string, hash: string | null) {
  if (!sessionSettings.project) sessionSettings.project = { hash: {} }
  if (!sessionSettings.project.hash) sessionSettings.project.hash = {}

  if (hash === null) {
    delete sessionSettings.project.hash[projectId]
  } else {
    sessionSettings.project.hash[projectId] = hash
  }

  reloadSettings()
}

export function updateSessionProjectRoot(projectId: string, root: string | null) {
  if (!sessionSettings.project) sessionSettings.project = { root: {} }
  if (!sessionSettings.project.root) sessionSettings.project.root = {}

  if (root === null) {
    delete sessionSettings.project.root[projectId]
  } else {
    sessionSettings.project.root[projectId] = root
  }
  reloadSettings()
}

export function updateSessionPerformance(performance: boolean) {
  sessionSettings.performance = performance
  reloadSettings()
}

export function insertSessionFilteredProfile(profileId: number) {
  if (!sessionSettings.filteredProfile) sessionSettings.filteredProfile = []

  if (sessionSettings.filteredProfile.includes(profileId)) {
    return
  } else {
    sessionSettings.filteredProfile.push(profileId)
  }
  reloadSettings()
}

export function removeSessionFilteredProfile(profileId: number) {
  if (!sessionSettings.filteredProfile) sessionSettings.filteredProfile = []

  const index = sessionSettings.filteredProfile.indexOf(profileId)

  if (index === -1) {
    return
  } else {
    sessionSettings.filteredProfile.splice(index, 1)
  }
  reloadSettings()
}

reloadSettings()

export default settings
