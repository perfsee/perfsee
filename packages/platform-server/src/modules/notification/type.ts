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

import { Environment, Project, Setting, Snapshot, SnapshotReport, User, Artifact } from '@perfsee/platform-server/db'
import { BundleJobUpdate } from '@perfsee/server-common'

export interface BundleNotificationInfo {
  artifact: Artifact
  result: BundleJobUpdate
  project: Project
  projectSetting: Setting
  projectOwners: User[]
}

export interface LabNotificationInfo {
  snapshot: Snapshot
  reports: SnapshotReport[]
  project: Project
  projectSetting: Setting
  projectOwners: User[]
}

export interface CookieNotificationInfo {
  project: Project
  projectSetting: Setting
  projectOwners: User[]
  environments: Environment[]
}

export interface NotificationProvider {
  sendBundleNotification: (info: BundleNotificationInfo) => Promise<boolean>
  sendLabNotification: (info: LabNotificationInfo) => Promise<boolean>
  sendCookieNotification: (info: CookieNotificationInfo) => Promise<boolean>
}
