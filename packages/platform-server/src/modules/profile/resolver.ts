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

import { Resolver, Query, Args, Int, Mutation, ResolveField, Parent, ID } from '@nestjs/graphql'

import { Profile, Project } from '@perfsee/platform-server/db'
import { transformInputType } from '@perfsee/platform-server/graphql'

import { Auth } from '../auth'
import { PermissionGuard, Permission } from '../permission'
import { ProjectService } from '../project/service'

import { DEVICES, CONNECTIONS } from './constants'
import { ProfileService } from './service'
import { UpdateProfileInput, DeviceType, ConnectionType } from './types'

@Resolver(() => Project)
export class ProjectProfileResolver {
  constructor(private readonly service: ProfileService) {}

  @ResolveField(() => [Profile], { name: 'profiles', description: 'all profiles in the project' })
  async profiles(@Parent() project: Project) {
    return this.service.getProfiles(project.id)
  }
}

@Auth()
@Resolver(() => Profile)
export class ProfileResolver {
  constructor(private readonly service: ProfileService, private readonly projectService: ProjectService) {}

  @Query(() => [ConnectionType])
  connections() {
    return CONNECTIONS
  }

  @Query(() => [DeviceType])
  devices() {
    return DEVICES
  }

  @Mutation(() => Profile, { description: 'create or update profile if id exists' })
  @PermissionGuard(Permission.Admin, 'projectId')
  async updateOrCreateProfile(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'input', type: () => UpdateProfileInput }, transformInputType) input: UpdateProfileInput,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    return this.service.updateProfile(projectRawId, input)
  }

  @Mutation(() => Boolean, {
    name: 'deleteProfile',
    description:
      'Delete profile with given id. NOTE: all snapshot report having the same profile id will be deleted as well.',
  })
  @PermissionGuard(Permission.Admin, 'projectId')
  async deleteProfile(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'profileId', type: () => Int }) iid: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const profile = await this.service.getProfile(projectRawId, iid)
    await this.service.deleteProfile(profile)
    return true
  }
}
