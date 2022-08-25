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

import { Args, Mutation, Resolver, ResolveField, Parent, ID } from '@nestjs/graphql'

import { Project, Setting } from '@perfsee/platform-server/db'

import { PermissionGuard, Permission } from '../permission'
import { ProjectService } from '../project/service'

import { SettingService } from './service'
import { UpdateSettingInput } from './types'

@Resolver(() => Project)
export class ProjectSettingResolver {
  constructor(private readonly service: SettingService) {}

  @ResolveField(() => Setting, { name: 'setting', description: 'get project settings' })
  setting(@Parent() project: Project) {
    return this.service.byProjectLoader.load(project.id)
  }
}

@Resolver(() => Setting)
export class SettingResolver {
  constructor(private readonly service: SettingService, private readonly projectService: ProjectService) {}

  @Mutation(() => Setting, { description: 'update project settings' })
  @PermissionGuard(Permission.Admin, 'projectId')
  async updateProjectSettings(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'input', type: () => UpdateSettingInput }) input: UpdateSettingInput,
  ): Promise<Setting> {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    if (!Object.keys(input).length) {
      return this.service.byProjectLoader.load(projectRawId)
    }

    return this.service.updateSetting(projectRawId, input)
  }
}
