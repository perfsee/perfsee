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

import { Resolver, Args, Int, Mutation, ResolveField, Parent, ID } from '@nestjs/graphql'

import { Environment, Project } from '@perfsee/platform-server/db'
import { transformInputType } from '@perfsee/platform-server/graphql'

import { PermissionGuard, Permission } from '../permission'
import { ProjectService } from '../project/service'

import { EnvironmentService } from './service'
import { UpdateEnvironmentInput } from './types'

@Resolver(() => Project)
export class ProjectEnvironmentResolver {
  constructor(private readonly service: EnvironmentService) {}

  @ResolveField(() => [Environment], { name: 'environments', description: 'all environments in the project' })
  environments(@Parent() project: Project) {
    return this.service.getEnvironments(project.id)
  }
}

@Resolver(() => Environment)
export class EnvironmentResolver {
  constructor(private readonly service: EnvironmentService, private readonly projectService: ProjectService) {}

  @Mutation(() => Environment, { description: 'update environment' })
  @PermissionGuard(Permission.Admin, 'projectId')
  async updateEnvironment(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'input', type: () => UpdateEnvironmentInput }, transformInputType) input: UpdateEnvironmentInput,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    return this.service.updateEnvironment(projectRawId, input)
  }

  @Mutation(() => Boolean, {
    description:
      'Delete environment with given id. NOTE: All snapshot reports with same environment id will be deleted as well.',
  })
  @PermissionGuard(Permission.Admin, 'projectId')
  async deleteEnvironment(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'envId', type: () => Int, description: 'id of environment to be deleted' }) iid: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const env = await this.service.getEnvironment(projectRawId, iid)
    await this.service.deleteEnvironment(env)
    return true
  }
}
