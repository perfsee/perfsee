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

import { AppVersion, Artifact, Project, Snapshot, SnapshotReport } from '@perfsee/platform-server/db'
import { BundleJobUpdate } from '@perfsee/server-common'

export enum CheckStatus {
  queued = 'queued',
  inProgress = 'inProgress',
  completed = 'completed',
}

export enum CheckType {
  Bundle = 'Bundle',
  Lab = 'Lab',
}

export enum CheckConclusion {
  Success = 'Success',
  Failure = 'Failure',
  Cancelled = 'Cancelled',
}

interface CheckTemplate {
  type: CheckType
  status: CheckStatus
  conclusion?: CheckConclusion
  commitHash: string
  project: Project

  startedAt?: Date
  completedAt?: Date

  runId: number

  detailsUrl?: string
}

interface CheckActionTemplate extends CheckTemplate {
  status: CheckStatus.inProgress | CheckStatus.queued
}

interface CheckEndTemplate extends CheckTemplate {
  status: CheckStatus.completed
  conclusion: CheckConclusion
}

export interface BundleCheckAction extends CheckActionTemplate {
  type: CheckType.Bundle
  artifact: Artifact
  version: AppVersion
}

export interface BundleCompletedAction extends CheckEndTemplate {
  type: CheckType.Bundle
  artifact: Artifact
  version: AppVersion
  baselineArtifact?: Artifact
  bundleJobResult: BundleJobUpdate
}

export interface LabCheckAction extends CheckActionTemplate {
  type: CheckType.Lab
  snapshot: Snapshot
  version: AppVersion
}

export interface LabCompletedAction extends CheckEndTemplate {
  type: CheckType.Lab
  snapshot: Snapshot
  version: AppVersion
  reports: SnapshotReport[]
}

export type CheckAction = BundleCheckAction | BundleCompletedAction | LabCheckAction | LabCompletedAction

export interface CheckSuiteProvider {
  createOrUpdateCheck: (action: CheckAction) => Promise<void>
}
