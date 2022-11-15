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

import { Int, Resolver, Args, GraphQLISODateTime, ResolveField, Parent } from '@nestjs/graphql'

import { AppVersion, Project } from '@perfsee/platform-server/db'

import { AppVersionService } from './service'

@Resolver(() => Project)
export class ProjectAppVersionResolver {
  constructor(private readonly service: AppVersionService) {}

  @ResolveField(() => [String])
  async recentBranches(@Parent() project: Project) {
    return this.service.recentBranches(project.id)
  }

  @ResolveField(() => [AppVersion], { name: 'appVersions', description: 'get app versions by project' })
  appVersions(
    @Parent() project: Project,
    @Args({ name: 'from', type: () => GraphQLISODateTime, nullable: true }) from: Date,
    @Args({ name: 'to', type: () => GraphQLISODateTime, nullable: true }) to: Date,
    @Args({ name: 'length', type: () => Int, nullable: true, description: 'max length of records returned' })
    length: number | undefined,
  ) {
    to = to ?? new Date()

    if (!length && !from) {
      from = new Date(to.getTime() - 1000 * 604800 /* 7 days */)
    }
    return this.service.getAppVersions(project.id, from, to, length)
  }

  @ResolveField(() => AppVersion, { name: 'appVersion', description: 'get app versions by hash' })
  appVersion(@Parent() project: Project, @Args({ name: 'hash', type: () => String }) hash: string) {
    return AppVersion.findOneByOrFail({ projectId: project.id, hash: hash })
  }
}
