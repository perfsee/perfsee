/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.group/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {
  Resolver,
  Query,
  Args,
  Mutation,
  ResolveField,
  Parent,
  ObjectType,
  Field,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql'

import { Artifact, Group, Project, Snapshot, User } from '@perfsee/platform-server/db'
import { PaginationInput, PaginatedType, paginate, Paginated } from '@perfsee/platform-server/graphql'

import { CurrentUser, Auth } from '../auth'
import { PermissionGuard, Permission } from '../permission'
import { UserWithPermission } from '../project/types'

import { GroupService } from './service'
import { CreateGroupInput, ScoreItem } from './types'

@ObjectType()
export class PaginatedGroups extends Paginated(Group) {}

@ObjectType()
export class GroupIdVerificationResult {
  @Field(() => Boolean)
  ok!: boolean

  @Field(() => String, { nullable: true })
  error!: string | undefined
}

@Auth()
@Resolver(() => Group)
export class GroupResolver {
  constructor(private readonly groupService: GroupService) {}

  @PermissionGuard(Permission.Read, 'id', true)
  @Query(() => Group, { name: 'group', description: 'get group by id' })
  getGroupById(@Args({ name: 'id', type: () => ID }) slug: string) {
    return this.groupService.getGroup(slug)
  }

  @Query(() => GroupIdVerificationResult, {
    description: 'Verify that the group id is available',
  })
  async verifyGroupId(@Args({ name: 'id', type: () => ID }) slug: string) {
    return this.groupService.verifyNewSlug(slug)
  }

  @Query(() => PaginatedGroups, { name: 'groups', description: 'paginated groups' })
  async getGroups(
    @CurrentUser() user: User,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10 } })
    paginationInput: PaginationInput,
    @Args({
      name: 'query',
      nullable: true,
      type: () => String,
      description: 'search group',
    })
    query: string | undefined,
  ): Promise<PaginatedType<Group>> {
    const [groups, totalCount] = await this.groupService.getGroups(user, paginationInput, query)
    return paginate(groups, 'id', paginationInput, totalCount)
  }

  @Mutation(() => Group)
  async createGroup(@CurrentUser() user: User, @Args('input') input: CreateGroupInput) {
    return this.groupService.create(user, input)
  }

  @PermissionGuard(Permission.Admin, 'groupId', true)
  @Mutation(() => Boolean)
  async addGroupOwner(
    @Args({ name: 'groupId', type: () => ID }) slug: string,
    @Args({ name: 'email', type: () => String }) email: string,
  ) {
    const groupRawId = await this.groupService.resolveRawGroupIdBySlug(slug)
    await this.groupService.addGroupOwner(groupRawId, email)
    return true
  }

  @PermissionGuard(Permission.Admin, 'groupId', true)
  @Mutation(() => Project)
  async updateGroupProject(
    @Args({ name: 'groupId', type: () => ID }) slug: string,
    @Args({ name: 'projectId', type: () => String }) projectSlug: string,
    @Args({ name: 'isAdd', type: () => Boolean }) isAdd: boolean,
  ) {
    const groupRawId = await this.groupService.resolveRawGroupIdBySlug(slug)
    return this.groupService.updateGroupProject(groupRawId, projectSlug, isAdd)
  }

  @PermissionGuard(Permission.Admin, 'groupId', true)
  @Mutation(() => Boolean)
  async updateGroupUserPermission(
    @Args({ name: 'groupId', type: () => ID }) slug: string,
    @Args({ name: 'email', type: () => String }) email: string,
    @Args({ name: 'permission', type: () => Permission }) permission: Permission,
    @Args({ name: 'isAdd', type: () => Boolean }) isAdd: boolean,
  ) {
    const groupRawId = await this.groupService.resolveRawGroupIdBySlug(slug)
    await this.groupService.updateGroupUserPermission(groupRawId, email, permission, isAdd)
    return true
  }

  @Mutation(() => Boolean, {
    description: 'Delete group with given id. NOTE: all data in this group will be deleted.',
  })
  @PermissionGuard(Permission.Admin, 'groupId', true)
  async deleteGroup(@Args({ name: 'groupId', type: () => ID }) slug: string) {
    const groupRawId = await this.groupService.resolveRawGroupIdBySlug(slug)
    await this.groupService.deleteGroup(groupRawId)

    return true
  }

  @ResolveField(() => [Permission], { description: 'current user permission to this group' })
  async userPermission(@CurrentUser() user: User, @Parent() group: Group) {
    return this.groupService.getUserPermission(user, group)
  }

  @ResolveField(() => [UserWithPermission], { description: 'authorized users of this group' })
  async authorizedUsers(@Parent() group: Group) {
    return this.groupService.getAuthorizedUsers(group)
  }

  @ResolveField(() => [Project], { description: 'projects in this group' })
  async projects(@Parent() group: Group) {
    return this.groupService.findProjectsByGroupId(group.id)
  }
}

@Resolver(() => Project)
export class GroupProjectResolver {
  constructor(private readonly service: GroupService) {}

  @ResolveField(() => ScoreItem, { description: 'bundle min,max,average score' })
  bundleScores(
    @Parent() project: Project,
    @Args({ name: 'from', type: () => GraphQLISODateTime }) from: Date,
    @Args({ name: 'to', type: () => GraphQLISODateTime }) to: Date,
  ) {
    return this.service.getBundleScores(from, to, project)
  }

  @ResolveField(() => ScoreItem, { description: 'lab min,max,average score' })
  labScores(
    @Parent() project: Project,
    @Args({ name: 'from', type: () => GraphQLISODateTime }) from: Date,
    @Args({ name: 'to', type: () => GraphQLISODateTime }) to: Date,
  ) {
    return this.service.getLabScores(from, to, project)
  }

  @ResolveField(() => [Artifact], { nullable: true, description: 'the oldest & latest artifacts' })
  artifactRecords(
    @Parent() project: Project,
    @Args({ name: 'from', type: () => GraphQLISODateTime }) from: Date,
    @Args({ name: 'to', type: () => GraphQLISODateTime }) to: Date,
    @Args({ name: 'isBaseline', type: () => Boolean, nullable: true }) isBaseline?: boolean,
  ) {
    return this.service.getArtifacts(from, to, project, isBaseline)
  }

  @ResolveField(() => [Snapshot], { nullable: true, description: 'the oldest & latest snapshot' })
  snapshotRecords(
    @Parent() project: Project,
    @Args({ name: 'from', type: () => GraphQLISODateTime }) from: Date,
    @Args({ name: 'to', type: () => GraphQLISODateTime }) to: Date,
  ) {
    return this.service.getSnapshots(from, to, project)
  }
}
