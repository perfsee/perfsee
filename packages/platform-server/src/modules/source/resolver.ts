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

import { Args, Int, ObjectType, Parent, ResolveField, Resolver } from '@nestjs/graphql'

import { Project, SnapshotReport, SourceIssue } from '@perfsee/platform-server/db'
import { PaginationInput, PaginatedType, paginate, Paginated } from '@perfsee/platform-server/graphql'

import { SnapshotReportService } from '../snapshot/snapshot-report/service'

import { SourceService } from './service'

@ObjectType()
export class PaginatedSourceIssues extends Paginated(SourceIssue) {}

@Resolver(() => Project)
export class ProjectSourceIssueResolver {
  constructor(private readonly service: SourceService) {}

  @ResolveField(() => PaginatedSourceIssues, { description: 'paginated source issues' })
  async sourceIssues(
    @Parent() project: Project,
    @Args({
      name: 'pagination',
      type: () => PaginationInput,
      nullable: true,
      defaultValue: { first: 10 },
    })
    paginationOption: PaginationInput,
    @Args({
      name: 'hash',
      type: () => String,
      nullable: true,
      description: 'git commit hash',
    })
    hash?: string,
    @Args({
      name: 'code',
      type: () => String,
      nullable: true,
      description: 'issue code',
    })
    issueCode?: string,
  ): Promise<PaginatedType<SourceIssue>> {
    const [issues, totalCount] = await this.service.getSourceIssues(project.id, paginationOption, hash, issueCode)

    return paginate(issues, 'id', paginationOption, totalCount)
  }

  @ResolveField(() => [String], { description: 'all versions that have source issues in recent 3 months' })
  issueCommits(@Parent() project: Project) {
    return this.service.getCommitsThatHaveIssues(project.id)
  }

  @ResolveField(() => SourceIssue, { nullable: true })
  sourceIssueById(@Parent() project: Project, @Args({ name: 'issueId', type: () => Int }) issueId: number) {
    return this.service.getIssueByIid(project.id, issueId)
  }
}

@Resolver(() => SourceIssue)
export class SourceIssueResolver {
  constructor(private readonly reportService: SnapshotReportService) {}

  @ResolveField(() => SnapshotReport, { name: 'snapshotReport' })
  resolveSnapshotReport(@Parent() issue: SourceIssue) {
    return this.reportService.loader.load(issue.snapshotReportId)
  }
}
