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
  Resolver,
  Args,
  Int,
  Mutation,
  ResolveField,
  Parent,
  ObjectType,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql'

import { Snapshot, Project, User, SnapshotTrigger } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { PaginationInput, PaginatedType, paginate, Paginated } from '@perfsee/platform-server/graphql'
import { SnapshotStatus } from '@perfsee/server-common'

import { CurrentUser } from '../auth'
import { PermissionGuard, Permission } from '../permission'
import { ProjectService } from '../project/service'
import { SourceService } from '../source/service'

import { SnapshotService } from './service'
import { SnapshotReportService } from './snapshot-report/service'

@ObjectType()
export class PaginatedSnapshots extends Paginated(Snapshot) {}

@Resolver(() => Project)
export class ProjectSnapshotResolver {
  constructor(private readonly service: SnapshotService) {}

  @ResolveField(() => Snapshot, { name: 'snapshot', description: 'snapshot detail' })
  snapshot(@Parent() project: Project, @Args({ name: 'snapshotId', type: () => Int }) iid: number) {
    return this.service.getSnapshot(project.id, iid)
  }

  @ResolveField(() => PaginatedSnapshots, { description: 'paginated snapshots' })
  async snapshots(
    @Parent() project: Project,
    @Args({
      name: 'pagination',
      type: () => PaginationInput,
      nullable: true,
      defaultValue: { first: 10 },
    })
    paginationOption: PaginationInput,
    @Args({ name: 'trigger', type: () => SnapshotTrigger, nullable: true })
    trigger?: SnapshotTrigger,
    @Args({ name: 'hash', type: () => String, nullable: true, description: 'Git commit hash filter' })
    hash?: string,
    @Args({
      name: 'hashRequired',
      type: () => Boolean,
      nullable: true,
      description: 'only returns snapshots that has commit hash related',
    })
    hashRequired?: boolean,
  ): Promise<PaginatedType<Snapshot>> {
    const [snapshots, totalCount] = await this.service.getSnapshots(
      project.id,
      paginationOption,
      trigger,
      hash,
      hashRequired,
    )

    return paginate(snapshots, 'id', paginationOption, totalCount)
  }

  @ResolveField(() => Int, { name: 'snapshotCount' })
  snapshotCount(@Parent() project: Project) {
    return this.service.getSnapshotCount(project.id)
  }

  @ResolveField(() => Snapshot, { nullable: true, description: 'latest snapshot detail' })
  latestSnapshot(
    @Parent() project: Project,
    @Args({ name: 'from', type: () => GraphQLISODateTime, nullable: true }) from: Date | undefined,
    @Args({ name: 'to', type: () => GraphQLISODateTime, nullable: true }) to: Date | undefined,
  ) {
    return this.service.getLatestSnapshot(project.id, from, to)
  }
}

@Resolver(() => Snapshot)
export class SnapshotResolver {
  constructor(
    private readonly service: SnapshotService,
    private readonly reportService: SnapshotReportService,
    private readonly sourceService: SourceService,
    private readonly projectService: ProjectService,
  ) {}

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Boolean, { description: 'delete snapshot' })
  async deleteSnapshot(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'snapshotId', type: () => Int }) iid: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    await this.service.deleteSnapshotById(projectRawId, iid)
    return true
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Snapshot, { name: 'takeSnapshot' })
  async takeSnapshot(
    @CurrentUser() user: User,
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'pageIds', type: () => [Int], nullable: true }) pageIids: number[],
    @Args({ name: 'profileIds', type: () => [Int], nullable: true }) profileIids: number[],
    @Args({ name: 'envIds', type: () => [Int], nullable: true }) envIids: number[],
    @Args({ name: 'title', type: () => String, nullable: true }) title: string,
    @Args({ name: 'commitHash', type: () => String, nullable: true }) hash: string,
  ) {
    const rawId = await this.projectService.resolveRawProjectIdBySlug(projectId)

    return this.service.takeSnapshot({
      projectId: rawId,
      pageIids,
      profileIids,
      envIids,
      issuer: user.email,
      hash,
      title,
    })
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Boolean, { name: 'pingConnection' })
  async pingConnection(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'pageId', type: () => Int }) pageIid: number,
    @Args({ name: 'profileId', type: () => Int, nullable: true }) profileIid?: number,
    @Args({ name: 'envId', type: () => Int, nullable: true }) envIid?: number,
  ) {
    const rawId = await this.projectService.resolveRawProjectIdBySlug(projectId)

    return this.service.pingConnection({
      projectId: rawId,
      pageIid,
      profileIid,
      envIid,
    })
  }

  @PermissionGuard(Permission.Read, 'projectId')
  @Mutation(() => Snapshot, { name: 'takeTempSnapshot' })
  async takeTempSnapshot(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'url', type: () => String }) url: string,
    @Args({ name: 'profileIds', type: () => [Int] }) profileIids: number[],
    @Args({ name: 'envId', type: () => Int }) envIid: number,
    @Args({ name: 'title', type: () => String, nullable: true }) title: string,
    @Args({ name: 'userflowScript', type: () => String, nullable: true }) script: string,
    @CurrentUser() user: User,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)

    return this.service.takeTempSnapshot(projectRawId, user.email, url, profileIids, envIid, title, script)
  }

  @PermissionGuard(Permission.Read, 'projectId')
  @Mutation(() => Boolean, { name: 'dispatchSnapshotReport' })
  async dispatchJob(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'snapshotReportId', type: () => Int }) iid: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const report = await this.reportService.getReportByIid(projectRawId, iid)

    if (!report) {
      throw new UserError(`Snapshot Report with id ${iid} not found.`)
    }

    if (report.status !== SnapshotStatus.Failed) {
      throw new UserError(`Only failed report can be dispatched.`)
    }

    return this.service
      .dispatchReport(report)
      .then(() => true)
      .catch((e) => {
        throw new UserError(`Failed to run job for snapshot report ${iid}: ${e.message}`)
      })
  }

  @PermissionGuard(Permission.Read, 'projectId')
  @Mutation(() => Boolean, {
    name: 'setSnapshotHash',
    description:
      'Set the commit hash associated with the snapshot, and the associated version cannot be modified. If the status of the snapshot is not completed will throw an error.',
  })
  async setSnapshotHash(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'snapshotId', type: () => Int }) iid: number,
    @Args({ name: 'hash', type: () => String }) hash: string,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const snapshot = await this.service.setSnapshotHash(projectRawId, iid, hash)
    const reports = await this.reportService.getReportsBySnapshotId(snapshot.id)
    await this.sourceService.startSourceIssueAnalyze(reports)

    return true
  }
}
