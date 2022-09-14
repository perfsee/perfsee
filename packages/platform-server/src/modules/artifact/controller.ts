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
  Controller,
  Post,
  Body,
  HttpException,
  HttpStatus,
  Query,
  Req,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common'
import { Request } from 'express'
import { v4 as uuid } from 'uuid'

import { InternalIdUsage } from '@perfsee/platform-server/db'
import { required } from '@perfsee/platform-server/error'
import { OnEvent } from '@perfsee/platform-server/event'
import { InternalIdService, UrlService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { BundleJobUpdate, JobType } from '@perfsee/server-common'
import { BuildUploadParams, gitHostFromDomain, isBaseline } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { AppVersionService } from '../app-version/service'
import { AuthService } from '../auth/auth.service'
import { PermissionProvider, Permission } from '../permission'
import { ProjectService } from '../project/service'

import { ArtifactService } from './service'

@Controller('/v1')
export class ArtifactController {
  constructor(
    private readonly logger: Logger,
    private readonly artifactService: ArtifactService,
    private readonly projectService: ProjectService,
    private readonly versionService: AppVersionService,
    private readonly metrics: Metric,
    private readonly internalId: InternalIdService,
    private readonly auth: AuthService,
    private readonly permission: PermissionProvider,
    private readonly storage: ObjectStorage,
    private readonly url: UrlService,
  ) {}

  @Post('/artifacts')
  async uploadArtifact(@Req() req: Request, @Body() file: Buffer, @Query() params: BuildUploadParams) {
    required(params, 'projectId', 'host', 'namespace', 'name', 'artifactName', 'branch', 'commitHash')
    const gitHost = gitHostFromDomain(params.host)
    if (!gitHost) {
      throw new BadRequestException('unsupported codebase host: ' + params.host)
    }

    const project = await this.projectService.getProject(params.projectId)

    if (!project) {
      throw new NotFoundException(`Project ${params.projectId} not found. Did you forget to create it?`)
    }

    const user = await this.auth.getUserFromRequest(req)
    if (!user || !(await this.permission.check(user, project.id, Permission.Admin))) {
      throw new ForbiddenException('Invalid build uploading token.')
    }

    if (project.host !== gitHost || project.namespace !== params.namespace || project.name !== params.name) {
      throw new BadRequestException(
        `Upload git repo ${gitHost}/${params.namespace}/${params.name} not match with the project ${project.host}/${project.namespace}/${project.name}`,
      )
    }

    this.logger.log(`receive build from project ${params.host}/${params.namespace}/${params.name}`)
    const metricsTags = { toolkit: params.toolkit, appVersion: params.appVersion, nodeVersion: params.nodeVersion }
    this.metrics.bundleUpload(1, metricsTags)

    try {
      const buildKey = `${project.id}/builds/${uuid()}.tar`
      await this.storage.upload(buildKey, file)

      const artifact = await this.artifactService.create(project, {
        iid: await this.internalId.generate(project.id, InternalIdUsage.Artifact),
        branch: params.branch,
        hash: params.commitHash,
        name: params.artifactName,
        issuer: user.email,
        buildKey,
        appVersion: params.appVersion,
        toolkit: params.toolkit,
        isBaseline: isBaseline(params.branch, project.artifactBaselineBranch),
      })

      this.logger.log(`artifact create. id=${artifact.id}`)

      await this.versionService.recordVersion({
        projectId: project.id,
        artifactId: artifact.id,
        hash: params.commitHash,
        branch: params.branch,
        version: params.tag,
      })

      return {
        status: 'success',
        url: this.url.projectUrl(pathFactory.project.bundle.detail, {
          projectId: project.slug,
          bundleId: artifact.iid,
        }),
      }
    } catch (e) {
      this.metrics.bundleUploadFail(1, metricsTags)
      throw new HttpException((e as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @OnEvent(`${JobType.BundleAnalyze}.update`)
  async parseStatsResult(message: BundleJobUpdate) {
    await this.artifactService.handleJobUpdated(message)
  }

  @OnEvent(`${JobType.BundleAnalyze}.error`)
  async failBundleAnalyze(jobId: number, reason: string) {
    await this.artifactService.handleJobFailed(jobId, reason)
  }
}
