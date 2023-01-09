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

import { Organization, User } from '@perfsee/platform-server/db'
import { PaginationInput, PaginatedType, paginate, Paginated } from '@perfsee/platform-server/graphql'

import { CurrentUser, Auth } from '../auth'
import { PermissionGuard, Permission } from '../permission'

import { OrganizationService } from './service'
import { CreateOrganizationInput, OrganizationUsage, UpdateOrganizationInput } from './types'

@ObjectType()
export class PaginatedOrganizations extends Paginated(Organization) {}

@ObjectType()
export class OrganizationIdVerificationResult {
  @Field(() => Boolean)
  ok!: boolean

  @Field(() => String, { nullable: true })
  error!: string | undefined
}

@Auth()
@Resolver(() => Organization)
export class OrganizationResolver {
  constructor(private readonly organizationService: OrganizationService) {}

  @PermissionGuard(Permission.Read, 'id', true)
  @Query(() => Organization, { name: 'organization', description: 'get organization by id' })
  getOrganizationById(@Args({ name: 'id', type: () => ID }) slug: string) {
    return this.organizationService.getOrganization(slug)
  }

  @Query(() => OrganizationIdVerificationResult, {
    name: 'verifyOrganizationId',
    description: 'Verify that the organization id is available',
  })
  async verifyOrganizationId(@Args({ name: 'id', type: () => ID }) slug: string) {
    return this.organizationService.verifyNewSlug(slug)
  }

  @Query(() => PaginatedOrganizations, { name: 'organizations', description: 'paginated organizations' })
  async getOrganizations(
    @CurrentUser() user: User,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10 } })
    paginationInput: PaginationInput,
    @Args({
      name: 'query',
      nullable: true,
      type: () => String,
      description: 'search organization',
    })
    query: string | undefined,
  ): Promise<PaginatedType<Organization>> {
    const [organizations, totalCount] = await this.organizationService.getOrganizations(user, paginationInput, query)
    return paginate(organizations, 'id', paginationInput, totalCount)
  }

  @Mutation(() => Organization)
  async createOrganization(@CurrentUser() user: User, @Args('input') input: CreateOrganizationInput) {
    return this.organizationService.create(user, input)
  }

  @PermissionGuard(Permission.Admin, 'organizationId', true)
  @Mutation(() => Organization)
  async updateOrganization(
    @Args({ name: 'organizationId', type: () => ID }) slug: string,
    @Args('input') input: UpdateOrganizationInput,
  ) {
    const organizationRawId = await this.organizationService.resolveRawOrganizationIdBySlug(slug)
    return this.organizationService.update(organizationRawId, input)
  }

  @PermissionGuard(Permission.Admin, 'organizationId', true)
  @Mutation(() => Boolean)
  async addOrganizationOwner(
    @Args({ name: 'organizationId', type: () => ID }) slug: string,
    @Args({ name: 'email', type: () => String }) email: string,
  ) {
    const organizationRawId = await this.organizationService.resolveRawOrganizationIdBySlug(slug)
    await this.organizationService.addOrganizationOwner(organizationRawId, email)
    return true
  }

  @PermissionGuard(Permission.Admin, 'organizationId', true)
  @Mutation(() => Boolean)
  async updateOrganizationUserPermission(
    @Args({ name: 'organizationId', type: () => ID }) slug: string,
    @Args({ name: 'email', type: () => String }) email: string,
    @Args({ name: 'permission', type: () => Permission }) permission: Permission,
    @Args({ name: 'isAdd', type: () => Boolean }) isAdd: boolean,
  ) {
    const organizationRawId = await this.organizationService.resolveRawOrganizationIdBySlug(slug)
    await this.organizationService.updateOrganizationUserPermission(organizationRawId, email, permission, isAdd)
    return true
  }

  @Mutation(() => Boolean, {
    description: 'Delete organization with given id. NOTE: all data in this organization will be deleted.',
  })
  @PermissionGuard(Permission.Admin, 'organizationId', true)
  async deleteOrganization(@Args({ name: 'organizationId', type: () => ID }) slug: string) {
    const organizationRawId = await this.organizationService.resolveRawOrganizationIdBySlug(slug)
    await this.organizationService.deleteOrganization(organizationRawId)

    return true
  }

  @ResolveField(() => [Permission], { description: 'current user permission to this organization' })
  async userPermission(@CurrentUser() user: User, @Parent() organization: Organization) {
    return this.organizationService.getUserPermission(user, organization)
  }

  @PermissionGuard(Permission.Read, 'id', true)
  @Query(() => [OrganizationUsage], {
    name: 'organizationUsage',
    description: 'get organization usage',
  })
  async getOrganizationUsage(
    @Args({ name: 'id', type: () => ID }) orgSlug: string,
    @Args({ name: 'from', type: () => GraphQLISODateTime, nullable: true }) from: Date,
    @Args({ name: 'to', type: () => GraphQLISODateTime, nullable: true }) to: Date,
  ) {
    const org = await this.organizationService.getOrganization(orgSlug)
    if (!org) {
      return null
    }
    return this.organizationService.getProjectUsages(from, to, org)
  }
}
