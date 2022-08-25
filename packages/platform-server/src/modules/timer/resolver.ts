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

import { Resolver, Args, Mutation, ResolveField, Parent, ID } from '@nestjs/graphql'

import { Project, Timer } from '@perfsee/platform-server/db'

import { PermissionGuard, Permission } from '../permission'
import { ProjectService } from '../project/service'

import { TimerService } from './service'
import { UpdateTimerInput } from './types'

@Resolver(() => Project)
export class ProjectTimerResolver {
  constructor(private readonly service: TimerService) {}

  @ResolveField(() => Timer, {
    name: 'timer',
    nullable: true,
    description: 'get project schedule task setting',
  })
  timer(@Parent() project: Project) {
    return this.service.getTimer(project.id)
  }
}

@Resolver(() => Timer)
export class TimerResolver {
  constructor(private readonly service: TimerService, private readonly projectService: ProjectService) {}

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Timer, { name: 'updateTimer', description: 'update project schedule task setting' })
  async updateTimer(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'input', type: () => UpdateTimerInput }) input: UpdateTimerInput,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    return this.service.updateTimer(projectRawId, input)
  }
}
