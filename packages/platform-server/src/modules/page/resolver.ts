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

import { Page, Project } from '@perfsee/platform-server/db'
import { transformInputType } from '@perfsee/platform-server/graphql'

import { PermissionGuard, Permission } from '../permission'
import { ProjectService } from '../project/service'

import { PageService } from './service'
import { CreatePageInput, PageRelation, UpdatePageInput } from './types'

@Resolver(() => Project)
export class ProjectPageResolver {
  constructor(private readonly service: PageService) {}

  @ResolveField(() => [Page], { name: 'pages', description: 'All pages created in project' })
  pages(@Parent() project: Project) {
    return this.service.getPages(project.id)
  }

  @ResolveField(() => [PageRelation], {
    name: 'pageRelations',
    description: 'pageId with profileIds, envIds, competitorIds',
  })
  pageRelations(@Parent() project: Project) {
    return this.service.getPageRelations(project.id)
  }
}

@Resolver(() => Page)
export class PageResolver {
  constructor(private readonly service: PageService, private readonly projectService: ProjectService) {}

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Page)
  async createPage(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'input', type: () => CreatePageInput }, transformInputType) input: CreatePageInput,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    return this.service.updateOrCreatePage(projectRawId, input)
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Page)
  async updatePage(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'input', type: () => UpdatePageInput }, transformInputType) input: UpdatePageInput,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    return this.service.updateOrCreatePage(projectRawId, input)
  }

  @Mutation(() => Boolean, {
    description:
      'Delete page with given id. NOTE: all snapshot report having the same page id will be deleted as well.',
  })
  @PermissionGuard(Permission.Admin, 'projectId')
  async deletePage(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'pageId', type: () => Int }) iid: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const page = await this.service.getPage(projectRawId, iid)
    await this.service.deletePage(page)
    return true
  }
}
