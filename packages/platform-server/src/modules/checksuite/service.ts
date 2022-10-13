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

import { Injectable } from '@nestjs/common'

import { AppVersion, Artifact, Project, Snapshot, SnapshotReport } from '@perfsee/platform-server/db'
import { UrlService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { BundleJobUpdate } from '@perfsee/server-common'
import { GitHost } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { GithubCheckSuiteProvider } from './providers/github'
import { CheckAction, CheckConclusion, CheckStatus, CheckType } from './types'

@Injectable()
export class CheckSuiteService {
  constructor(
    private readonly githubProvider: GithubCheckSuiteProvider,
    private readonly logger: Logger,
    private readonly url: UrlService,
  ) {}

  async startBundleCheck(artifact: Artifact, project: Project, version: AppVersion) {
    await this.createOrUpdateCheck({
      project,
      commitHash: artifact.hash,
      runId: artifact.id,
      status: CheckStatus.queued,
      startedAt: new Date(),
      type: CheckType.Bundle,
      artifact,
      version,
      detailsUrl: this.url.projectUrl(pathFactory.project.bundle.home, {
        projectId: project.slug,
      }),
    })
  }

  async runBundleCheck(artifact: Artifact, project: Project, version: AppVersion) {
    await this.createOrUpdateCheck({
      project,
      commitHash: artifact.hash,
      runId: artifact.id,
      status: CheckStatus.inProgress,
      type: CheckType.Bundle,
      artifact,
      version,
      detailsUrl: this.url.projectUrl(pathFactory.project.bundle.home, {
        projectId: project.slug,
      }),
    })
  }

  async endBundleCheck(
    artifact: Artifact,
    baselineArtifact: Artifact | undefined,
    project: Project,
    bundleResult: BundleJobUpdate,
    version: AppVersion,
  ) {
    await this.createOrUpdateCheck({
      project,
      commitHash: artifact.hash,
      runId: artifact.id,
      status: CheckStatus.completed,
      conclusion: artifact.succeeded() ? CheckConclusion.Success : CheckConclusion.Failure,
      completedAt: new Date(),
      type: CheckType.Bundle,
      version,
      detailsUrl: this.url.projectUrl(pathFactory.project.bundle.detail, {
        projectId: project.slug,
        bundleId: artifact.iid,
      }),
      artifact,
      baselineArtifact,
      bundleJobResult: bundleResult,
    })
  }

  async startLabCheck(project: Project, snapshot: Snapshot, version: AppVersion) {
    if (!snapshot.hash) {
      return
    }
    await this.createOrUpdateCheck({
      project,
      commitHash: snapshot.hash,
      runId: snapshot.id,
      status: CheckStatus.queued,
      type: CheckType.Lab,
      version,
      snapshot,
    })
  }

  async runLabCheck(project: Project, snapshot: Snapshot, version: AppVersion) {
    if (!snapshot.hash) {
      return
    }
    await this.createOrUpdateCheck({
      project,
      commitHash: snapshot.hash,
      runId: snapshot.id,
      status: CheckStatus.inProgress,
      type: CheckType.Lab,
      version,
      snapshot,
    })
  }

  async endLabCheck(project: Project, snapshot: Snapshot, reports: SnapshotReport[], version: AppVersion) {
    if (!snapshot.hash) {
      return
    }
    await this.createOrUpdateCheck({
      project,
      commitHash: snapshot.hash,
      runId: snapshot.id,
      status: CheckStatus.completed,
      type: CheckType.Lab,
      reports,
      snapshot,
      version,
      conclusion: CheckConclusion.Success,
    })
  }

  async createOrUpdateCheck(action: CheckAction) {
    try {
      this.logger.verbose(`Creating or updating check type: ${action.type}, status: ${action.status}.`)
      if (action.project.host === GitHost.Github) {
        await this.githubProvider.createOrUpdateCheck(action)
      }
    } catch (e) {
      this.logger.error(`Create or update check error ${e instanceof Error ? e.stack : e}`)
    }
  }
}
