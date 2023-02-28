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

import { BadRequestException, Controller, ForbiddenException, Get, NotFoundException, Query, Req } from '@nestjs/common'
import { Request } from 'express'
import { mapKeys, pick } from 'lodash'

import { required } from '@perfsee/platform-server/error'

import { AuthService } from '../auth/auth.service'
import { EnvironmentService } from '../environment/service'
import { PageService } from '../page/service'
import { Permission, PermissionProvider } from '../permission'
import { ProfileService } from '../profile/service'
import { ProjectService } from '../project/service'

import { SnapshotService } from './service'
import { SnapshotReportService } from './snapshot-report/service'

interface TakeSnapshotParams {
  projectId: string
  hash: string
  title: string
  env: string[] | string
  page: string[] | string
  profile: string[] | string
}

function parseArrayParams(p: string | string[] | null): string[] {
  if (p) {
    if (typeof p === 'string') {
      return [p]
    } else {
      return p
    }
  } else {
    return []
  }
}

@Controller('/v1')
export class SnapshotController {
  constructor(
    private readonly service: SnapshotService,
    private readonly snapshotReportService: SnapshotReportService,
    private readonly auth: AuthService,
    private readonly permission: PermissionProvider,
    private readonly projectService: ProjectService,
    private readonly pageService: PageService,
    private readonly environmentService: EnvironmentService,
    private readonly profileService: ProfileService,
  ) {}

  @Get('/take-snapshot')
  async takeSnapshot(@Req() req: Request, @Query() params: TakeSnapshotParams) {
    required(params, 'projectId')

    const envFilter = parseArrayParams(params.env)
    const pageFilter = parseArrayParams(params.page)
    const profileFilter = parseArrayParams(params.profile)

    const project = await this.projectService.slugLoader.load(params.projectId)

    if (!project) {
      throw new NotFoundException(`Project ${params.projectId} not found. Did you forget to create it?`)
    }

    const user = await this.auth.getUserFromRequest(req)
    if (!user || !(await this.permission.check(user, project.id, Permission.Admin))) {
      throw new ForbiddenException('Invalid access token.')
    }

    const pages = await this.pageService.getPages(project.id)
    const environments = await this.environmentService.getEnvironments(project.id)
    const profiles = await this.profileService.getProfiles(project.id)

    const pageIids = pageFilter.map((pageName) => {
      const page = pages.find((p) => p.name === pageName)
      if (!page) {
        throw new BadRequestException(`Page "${pageName}" not found`)
      }
      return page.iid
    })

    const envIids = envFilter.map((envName) => {
      const env = environments.find((p) => p.name === envName)
      if (!env) {
        throw new BadRequestException(`Environment "${envName}" not found`)
      }
      return env.iid
    })

    const profileIids = profileFilter.map((profileName) => {
      const profile = profiles.find((p) => p.name === profileName)
      if (!profile) {
        throw new BadRequestException(`Profile "${profileName}" not found`)
      }
      return profile.iid
    })

    const snapshot = await this.service.takeSnapshot({
      projectId: project.id,
      pageIids,
      profileIids,
      envIids,
      issuer: user.email,
      hash: params.hash,
      title: params.title,
    })

    const reports = await this.snapshotReportService.getReportsBySnapshotId(snapshot.id)

    return {
      id: snapshot.iid,
      ...pick(snapshot, 'status', 'startedAt', 'createdAt', 'issuer', 'hash', 'title', 'trigger'),
      reports: reports.map((report) => ({
        id: report.iid,
        ...pick(report, 'createdAt', 'status', 'host'),
        page: mapKeys(
          pick(
            pages.find((p) => p.id === report.pageId),
            'iid',
            'name',
            'url',
            'isCompetitor',
            'isTemp',
            'isE2e',
          ),
          (_, k) => (k === 'iid' ? 'id' : k),
        ),
        profile: mapKeys(
          pick(
            profiles.find((p) => p.id === report.profileId),
            'iid',
            'name',
            'device',
            'bandWidth',
          ),
          (_, k) => (k === 'iid' ? 'id' : k),
        ),
        env: mapKeys(
          pick(
            environments.find((e) => e.id === report.envId),
            'iid',
            'name',
            'zone',
          ),
          (_, k) => (k === 'iid' ? 'id' : k),
        ),
      })),
    }
  }
}
