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

import { NotFoundException } from '@nestjs/common'
import {
  Args,
  GraphQLISODateTime,
  ID,
  Int,
  Mutation,
  ObjectType,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql'

import { AppVersion, Package, PackageBundle, Project, User } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { paginate, Paginated, PaginationInput } from '@perfsee/platform-server/graphql'
import { packageLink } from '@perfsee/platform-server/utils'

import { CurrentUser } from '../auth'
import { Permission, PermissionGuard } from '../permission'
import { ProjectService } from '../project/service'

import { PackageService } from './service'

@ObjectType()
export class PaginatedPackages extends Paginated(Package) {}

@ObjectType()
export class PaginatedPackageBundles extends Paginated(PackageBundle) {}

@Resolver(() => Project)
export class ProjectPackagesResolver {
  constructor(private readonly service: PackageService) {}

  @ResolveField(() => PaginatedPackages, { description: 'paginated packages for given project' })
  async packages(
    @Parent() project: Project,
    @Args({
      name: 'pagination',
      type: () => PaginationInput,
      nullable: true,
      defaultValue: { first: 10 },
    })
    paginationOption: PaginationInput,
    @Args({ name: 'name', type: () => String, nullable: true, description: 'name filter' }) name?: string,
  ) {
    const [packages, totalCount] = await this.service.getPackages(project.id, paginationOption, name)

    return paginate(packages, 'id', paginationOption, totalCount)
  }

  @ResolveField(() => Package, { name: 'package', description: 'get package by id' })
  package(@Parent() project: Project, @Args({ name: 'id', type: () => Int, description: 'package id' }) id: number) {
    return this.service.getPackageById(project.id, id)
  }
}

@Resolver(() => Package)
export class PackageResolver {
  constructor(private readonly service: PackageService, private readonly projectService: ProjectService) {}

  @ResolveField(() => PaginatedPackageBundles)
  async bundles(
    @Parent() pkg: Package,
    @Args({
      name: 'pagination',
      type: () => PaginationInput,
      nullable: true,
      defaultValue: { first: 5 },
    })
    paginationOption: PaginationInput,
    @Args({ name: 'branch', type: () => String, nullable: true, description: 'git branch filter' }) branch?: string,
    @Args({ name: 'hash', type: () => String, nullable: true, description: 'hash filter' }) hash?: string,
  ) {
    const [bundles, totalCount] = await this.service.getPackageBundles(pkg.id, paginationOption, branch, hash)

    return paginate(bundles, 'id', paginationOption, totalCount)
  }

  @Query(() => PaginatedPackages, { name: 'packages', description: 'paginated packages' })
  async getPackages(
    @CurrentUser() user: User,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10 } })
    paginationInput: PaginationInput,
    @Args({ name: 'starred', nullable: true, defaultValue: false, description: 'filter your starred packages' })
    starred: boolean,
    @Args({
      name: 'query',
      nullable: true,
      type: () => String,
      description: 'search packages with name',
    })
    query: string | undefined,
    @Args({
      name: 'permission',
      nullable: true,
      type: () => Permission,
      description: 'filter packages with permission',
    })
    permission: Permission | undefined,
  ) {
    const [packages, totalCount] = await this.service.getAllPackages(user, paginationInput, query, starred, permission)
    return paginate(packages, 'id', paginationInput, totalCount)
  }

  @ResolveField(() => ID)
  async projectId(@Parent() pkg: Package) {
    const project = await this.projectService.loader.load(pkg.projectId)
    if (!project) {
      throw new NotFoundException('project not found')
    }
    return project.slug
  }
}

@Resolver(() => PackageBundle)
export class PackageBundleResolver {
  constructor(private readonly service: PackageService, private readonly projectService: ProjectService) {}

  @ResolveField(() => AppVersion, {
    nullable: true,
  })
  async appVersion(@Parent() packageBundle: PackageBundle) {
    return packageBundle.appversion ?? (await AppVersion.findOneBy({ hash: packageBundle.hash }))
  }

  @ResolveField(() => Int, { description: 'package iid' })
  async packageId(@Parent() packageBundle: PackageBundle) {
    return this.service.resolvePackageIidById(packageBundle.packageId)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to build analysis report file' })
  reportLink(@Parent() packageBundle: PackageBundle) {
    return packageLink(packageBundle.reportKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to build benchmark report file' })
  benchmarkLink(@Parent() packageBundle: PackageBundle) {
    return packageLink(packageBundle.benchmarkKey)
  }

  @ResolveField(() => String, { nullable: true, description: 'the link to uploaded build tar file' })
  buildLink(@Parent() packageBundle: PackageBundle) {
    return packageLink(packageBundle.buildKey)
  }

  @Query(() => PackageBundle, { description: 'get package bundle by id' })
  async packageBundle(
    @Args({ name: 'projectId', type: () => ID, description: 'project id' }) projectId: string,
    @Args({ name: 'packageId', type: () => ID, description: 'package id' }) packageId: number,
    @Args({ name: 'id', type: () => ID, description: 'package bundle id', nullable: true }) id?: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const pkgRawId = await this.service.resolveRawPackageIdByIid(projectRawId, packageId)

    if (!id) {
      return this.service.getLatestPackageBundle(pkgRawId)
    }
    return this.service.getPackageBundleByIid(pkgRawId, id)
  }

  @Query(() => [PackageBundle], { description: 'get package bundle history' })
  async packageBundleHistory(
    @Args({ name: 'projectId', type: () => ID, description: 'project id' }) projectId: string,
    @Args({ name: 'packageId', type: () => ID }) packageId: number,
    @Args({ name: 'to', type: () => GraphQLISODateTime }) to: Date,
    @Args({ name: 'limit', type: () => Int, nullable: true }) limit: number,
    @Args({ name: 'branch', nullable: true, type: () => String }) branch?: string,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const pkgRawId = await this.service.resolveRawPackageIdByIid(projectRawId, packageId)
    return this.service.getHistory(pkgRawId, to, limit, branch)
  }

  @PermissionGuard(Permission.Admin, 'projectId')
  @Mutation(() => Boolean)
  async deletePackageBundle(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'packageId', type: () => Int }) packageId: number,
    @Args({ name: 'id', type: () => Int, description: 'pakcage bundle id' }) id: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const pkgRawId = await this.service.resolveRawPackageIdByIid(projectRawId, packageId)
    return this.service.deleteBundleById(projectRawId, pkgRawId, id)
  }

  @PermissionGuard(Permission.Read, 'projectId')
  @Mutation(() => Boolean, { description: 'trigger artifact bundle analyze job' })
  async dispatchPackageJob(
    @Args({ name: 'projectId', type: () => ID }) projectId: string,
    @Args({ name: 'packageId', type: () => Int, description: 'package id' }) packageId: number,
    @Args({ name: 'id', type: () => Int, description: 'package bundle id' }) id: number,
  ) {
    const projectRawId = await this.projectService.resolveRawProjectIdBySlug(projectId)
    const packageRawId = await this.service.resolveRawPackageIdByIid(projectRawId, packageId)
    const packageBundle = await this.service.getPackageBundleByIid(packageRawId, id)

    if (!packageBundle) {
      throw new UserError(`Artifact with id ${id} not found.`)
    }

    await this.service.dispatchJob(projectRawId, packageBundle).catch(() => {
      throw new UserError(`Failed to create new job for package bundle ${id}`)
    })

    return true
  }
}
