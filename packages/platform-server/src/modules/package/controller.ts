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
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common'
import { ApiExcludeController } from '@nestjs/swagger'
import { v4 as uuid } from 'uuid'

import { User } from '@perfsee/platform-server/db'
import { required } from '@perfsee/platform-server/error'
import { OnEvent } from '@perfsee/platform-server/event'
import { UrlService } from '@perfsee/platform-server/helpers'
import { Logger } from '@perfsee/platform-server/logger'
import { Metric } from '@perfsee/platform-server/metrics'
import { ObjectStorage } from '@perfsee/platform-server/storage'
import { packageKey } from '@perfsee/platform-server/utils'
import { JobType, PackageJobUpdate } from '@perfsee/server-common'
import { EMAIL_REGEXP, GitHost, gitHostFromDomain, PackageUploadParams, Permission } from '@perfsee/shared'
import { pathFactory } from '@perfsee/shared/routes'

import { AppVersionService } from '../app-version/service'
import { CurrentUser } from '../auth'
import { PermissionProvider } from '../permission'
import { ProjectUsageService } from '../project-usage/service'
import { ProjectService } from '../project/service'

import { PackageService } from './service'

@ApiExcludeController()
@Controller('v1')
export class PackageController {
  constructor(
    private readonly projectService: ProjectService,
    private readonly logger: Logger,
    private readonly projectUsage: ProjectUsageService,
    private readonly metrics: Metric,
    private readonly permission: PermissionProvider,
    private readonly storage: ObjectStorage,
    private readonly url: UrlService,
    private readonly packageService: PackageService,
    private readonly versionService: AppVersionService,
  ) {}

  @Post('/packages')
  async uploadPackage(@Body() file: Buffer, @Query() params: PackageUploadParams, @CurrentUser() user?: User) {
    required(params, 'projectId', 'host', 'namespace', 'name', 'packageName', 'packageVersion', 'branch', 'commitHash')
    const gitHost = gitHostFromDomain(params.host)
    if (!gitHost) {
      throw new BadRequestException('unsupported codebase host: ' + params.host)
    }

    const project = await this.projectService.slugLoader.load(params.projectId)

    if (!project) {
      throw new NotFoundException(`Project ${params.projectId} not found. Did you forget to create it?`)
    }

    if (!user || !(await this.permission.check(user, project.id, Permission.Admin))) {
      throw new ForbiddenException('Invalid build uploading token.')
    }

    if (params.author && !params.author.match(EMAIL_REGEXP)) {
      throw new BadRequestException('Invalid author email address: ' + params.author)
    }

    if (
      project.host !== GitHost.Unknown &&
      (project.host !== gitHost || project.namespace !== params.namespace || project.name !== params.name)
    ) {
      throw new BadRequestException(
        `Upload git repo ${gitHost}/${params.namespace}/${params.name} not match with the project ${project.host}/${project.namespace}/${project.name}`,
      )
    }

    this.logger.log(`receive package from project ${params.host}/${params.namespace}/${params.name}`)
    const metricsTags = { appVersion: params.appVersion, nodeVersion: params.nodeVersion }
    this.metrics.packageUpload(1, metricsTags)

    try {
      await this.projectUsage.verifyUsageLimit(project.id)

      const buildKey = packageKey(project.id, `bundles/${uuid()}.tar`)
      await this.storage.upload(buildKey, file)

      await this.projectUsage.recordStorageUsage(project.id, file.byteLength)

      const { bundle, pkg } = await this.packageService.createBundle(project, {
        buildKey,
        name: params.packageName,
        version: params.packageVersion,
        hash: params.commitHash,
        issuer: user.email || params.author,
        branch: params.branch,
        appVersion: params.appVersion,
        description: params.description,
        keywords: params.keywords?.split(','),
      })

      await this.versionService.recordVersion({
        projectId: project.id,
        hash: params.commitHash,
        branch: params.branch,
        version: params.tag,
        pr: params.pr?.number,
        commitMessage: params.commitMessage?.replace(/\n.*/g, '').substring(0, 255),
      })

      this.logger.log(`package bundle create. id=${bundle.id}`)

      return {
        status: 'success',
        url: this.url.platformUrl(pathFactory.project.package.detail, {
          projectId: project.slug,
          packageId: pkg.iid,
          packageBundleId: bundle.iid,
        }),
      }
    } catch (e) {
      this.metrics.packageUploadFail(1, metricsTags)
      this.logger.error('package upload failed,', { error: (e as Error).message })
      throw new HttpException((e as Error).message, HttpStatus.BAD_REQUEST)
    }
  }

  @OnEvent(`${JobType.PackageAnalyze}.update`)
  async parseStatsResult(message: PackageJobUpdate) {
    await this.packageService.handleJobUpdated(message)
  }

  @OnEvent(`${JobType.PackageAnalyze}.error`)
  async failBundleAnalyze(jobId: number, reason: string) {
    await this.packageService.handleJobFailed(jobId, reason)
  }

  @OnEvent(`${JobType.PackageAnalyze}.upload`)
  async handleArtifactUploadSize(artifactId: number, uploadSize: number) {
    await this.packageService.handleJobUpload(artifactId, uploadSize)
  }
}
