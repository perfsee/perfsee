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

import { BadRequestException } from '@nestjs/common'
import { Resolver, Args, Int, ResolveField, Parent, Mutation, ID } from '@nestjs/graphql'
import { isNil, omitBy } from 'lodash'

import {
  Artifact,
  Environment,
  Page,
  Profile,
  Project,
  Snapshot,
  SnapshotReport,
  SourceIssue,
} from '@perfsee/platform-server/db'
import { transformInputType } from '@perfsee/platform-server/graphql'
import { artifactLink } from '@perfsee/platform-server/utils'

import { Permission, PermissionGuard } from '../../permission'
import { ProjectService } from '../../project/service'

import { SnapshotReportService } from './service'
import { SnapshotReportFilter } from './types'

@Resolver(() => Snapshot)
export class SnapshotReportResolver {
  constructor(private readonly service: SnapshotReportService) {}

  @ResolveField(() => [SnapshotReport], { description: 'get reports with given snapshot id' })
  snapshotReports(@Parent() snapshot: Snapshot) {
    return this.service.getReportsBySnapshotId(snapshot.id)
  }

  @ResolveField(() => SnapshotReport)
  snapshotReport(@Parent() snapshot: Snapshot, @Args({ name: 'reportId', type: () => Int }) reportIid: number) {
    return this.service.getReportByIid(snapshot.projectId, reportIid)
  }
}

@Resolver(() => SnapshotReport)
export class ReportResolver {
  constructor(private readonly service: SnapshotReportService, private readonly projectService: ProjectService) {}

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Boolean)
  async deleteSnapshotReport(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'snapshotReportId', type: () => Int }) snapshotReportId: number,
  ) {
    const rawId = await this.projectService.resolveRawProjectIdBySlug(projectId)

    return this.service.deleteSnapshotsReportById(rawId, snapshotReportId)
  }

  @ResolveField(() => Environment, { name: 'environment', description: 'the environment this report used' })
  environment(@Parent() report: SnapshotReport) {
    return this.service.envLoader.load(report.envId)
  }

  @ResolveField(() => Profile, { name: 'profile', description: 'the profile this report used' })
  profile(@Parent() report: SnapshotReport) {
    return this.service.profileLoader.load(report.profileId)
  }

  @ResolveField(() => Page, { name: 'page', description: 'the page this report used' })
  page(@Parent() report: SnapshotReport) {
    return this.service.pageLoader.load(report.pageId)
  }

  @ResolveField(() => Snapshot, { name: 'snapshot', description: 'the snapshot of this report' })
  resolveSnapshot(@Parent() report: SnapshotReport) {
    return this.service.snapshotLoader.load(report.snapshotId)
  }

  @ResolveField(() => [SourceIssue], { name: 'issues', description: 'found performance issues' })
  issuesBySnapshotReportId(@Parent() report: SnapshotReport) {
    return this.service.getIssuesBySnapshotReportId(report.id)
  }

  @ResolveField(() => [Artifact], { name: 'artifacts', description: 'artifacts used in this report', nullable: true })
  async artifacts(@Parent() report: SnapshotReport) {
    return this.service.getSnapshotReportArtifacts(report.id)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to snapshot report detail file' })
  reportLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.lighthouseStorageKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to snapshot report screencast file' })
  screencastLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.screencastStorageKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to snapshot report flame Chart data file' })
  flameChartLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.flameChartStorageKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to snapshot report source coverage data file' })
  sourceCoverageLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.sourceCoverageStorageKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to snapshot report react profile data file' })
  reactProfileLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.reactProfileStorageKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to statistics from source analysis' })
  sourceAnalyzeStatisticsLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.sourceAnalyzeStatisticsStorageKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to trace data detail file' })
  traceDataLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.traceDataStorageKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to all requests detail file' })
  requestsLink(@Parent() report: SnapshotReport) {
    return artifactLink(report.requestsStorageKey)
  }

  @ResolveField(() => [SnapshotReport], { nullable: true, description: 'user flow steps of this report' })
  userFlow(@Parent() report: SnapshotReport) {
    return this.service.getStepsOfSnapshotReport(report)
  }
}

@Resolver(() => Project)
export class ProjectReportResolver {
  constructor(private readonly service: SnapshotReportService) {}

  @ResolveField(() => SnapshotReport)
  snapshotReport(@Parent() project: Project, @Args({ name: 'reportId', type: () => Int }) reportIid: number) {
    return this.service.getReportByIid(project.id, reportIid)
  }

  @ResolveField(() => [SnapshotReport], {
    description: 'get snapshot reports with filters',
  })
  async snapshotReports(
    @Parent() project: Project,
    @Args({ name: 'filter', type: () => SnapshotReportFilter }, transformInputType) rawFilter: SnapshotReportFilter,
  ) {
    const filter = omitBy(rawFilter, isNil) as SnapshotReportFilter
    if (!Object.keys(filter).length) {
      throw new BadRequestException('Filter must at least have one field')
    }

    if (typeof filter.length === 'number' && filter.length < 0) {
      throw new BadRequestException('Length should be positive integer')
    }
    if (filter.hash) {
      return this.service.getReportsByCommitHash(project.id, filter.hash)
    }

    if (filter.iids) {
      return this.service.getReportsByIids(project.id, filter.iids)
    } else {
      return this.service.filterReports(project.id, filter)
    }
  }
}
