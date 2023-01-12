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

import { Args, ID, Int, Mutation, ObjectType, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql'

import { Project, Application, User } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { PaginationInput, PaginatedType, paginate, Paginated } from '@perfsee/platform-server/graphql'

import { Auth } from '../auth'
import { PermissionGuard, Permission } from '../permission'

import { ApplicationService } from './service'
import { ApplicationAuthorizedProjectsNode, CreateApplicationResult, ProjectAuthorizedApplicationsNode } from './types'

@ObjectType()
class PaginatedApplications extends Paginated(Application) {}

@Resolver(() => Project)
export class ProjectAuthorizedApplicationResolver {
  constructor(private readonly service: ApplicationService) {}

  @ResolveField(() => [ProjectAuthorizedApplicationsNode])
  authorizedApplications(@Parent() project: Project) {
    return this.service.getAuthorizedApplications(project.id)
  }

  @Mutation(() => Boolean)
  @PermissionGuard(Permission.Admin, 'projectId')
  async authorizeApplication(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'applicationId', type: () => Int }) applicationId: number,
    @Args({ name: 'permissions', type: () => [Permission!] }) permissions: Permission[],
  ) {
    await this.service.authApplication(projectId, applicationId, permissions)
    return true
  }

  @Mutation(() => [Permission])
  @PermissionGuard(Permission.Admin, 'projectId')
  updateApplicationPermissions(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'applicationId', type: () => Int }) appId: number,
    @Args({ name: 'permissions', type: () => [Permission] }) permissions: Permission[],
  ) {
    return this.service.updateApplicationPermissions(projectId, appId, permissions)
  }

  @Mutation(() => Boolean)
  @PermissionGuard(Permission.Admin, 'projectId')
  revokeApplicationPermissions(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'applicationId', type: () => Int }) applicationId: number,
  ) {
    return this.service.revokeApplicationPermissions(projectId, applicationId)
  }
}

@Auth()
@Resolver(() => Application)
export class ApplicationResolver {
  constructor(private readonly service: ApplicationService) {}

  @Query(() => Application)
  async application(
    @Args({ name: 'id', type: () => Int, nullable: true }) id?: number,
    @Args({ name: 'name', type: () => String, nullable: true }) name?: string,
  ) {
    if (id) {
      return this.service.loader.load(id)
    } else if (name) {
      return User.findOneByOrFail({ username: name, isApp: true })
    } else {
      throw new UserError('missing query condition')
    }
  }

  @Query(() => PaginatedApplications)
  async applications(
    @Args({
      name: 'pagination',
      type: () => PaginationInput,
      nullable: true,
      defaultValue: { first: 10 },
    })
    paginationOption: PaginationInput,
  ): Promise<PaginatedType<Application>> {
    const [applications, totalCount] = await this.service.getApplications(paginationOption)

    return paginate(applications, 'id', paginationOption, totalCount)
  }

  @Auth('admin')
  @Mutation(() => CreateApplicationResult)
  createApplication(@Args('name') name: string) {
    return this.service.createApplication(name)
  }

  @ResolveField(() => [ApplicationAuthorizedProjectsNode], { description: 'projects that application can access' })
  async authorizedProjects(@Parent() app: Application) {
    return this.service.getApplicationAuthorizedProjects(app.id)
  }
}
