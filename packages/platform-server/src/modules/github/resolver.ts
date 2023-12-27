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

import { Args, Field, Int, ObjectType, Query, Resolver } from '@nestjs/graphql'

import { User } from '@perfsee/platform-server/db'
import { UserError } from '@perfsee/platform-server/error'
import { Paginated, PaginationInput } from '@perfsee/platform-server/graphql'
import { ExternalAccount } from '@perfsee/shared'

import { Auth, CurrentUser } from '../auth/auth.guard'
import { UserService } from '../user'

import { GithubService } from './service'

@ObjectType()
class GithubRepository {
  @Field(() => Int)
  id!: number

  @Field(() => String)
  name!: string

  @Field(() => String)
  full_name!: string

  @Field(() => Boolean)
  private!: boolean

  @Field(() => String)
  default_branch!: string
}

@ObjectType()
export class PaginatedGithubRepositories extends Paginated(GithubRepository) {}

@ObjectType()
class GithubAccount {
  @Field(() => String)
  login!: string

  @Field(() => String)
  avatar_url!: string

  @Field(() => String)
  type!: string
}

@ObjectType()
class GithubInstallation {
  @Field(() => Int)
  id!: number
  @Field(() => GithubAccount)
  account!: GithubAccount
}

@ObjectType()
export class GithubRepoVerificationResult {
  @Field(() => Boolean)
  ok!: boolean

  @Field(() => String, { nullable: true })
  error!: string | undefined
}

@ObjectType()
export class PaginatedGithubInstallations extends Paginated(GithubInstallation) {}

@Auth()
@Resolver()
export class GithubIntegrationResolver {
  constructor(private readonly userService: UserService, private readonly service: GithubService) {}

  @Query(() => GithubInstallation, {
    name: 'githubInstallation',
    nullable: true,
    description:
      'Get installation by the github account connected with the current user. Throws if user is not connected to github account.',
  })
  async getGithubInstallation(@CurrentUser() user: User) {
    const githubAccount = await this.userService.getUserConnectedAccount(user, ExternalAccount.github)
    if (!githubAccount?.accessToken) {
      throw new UserError('Please connect your github account first.')
    }

    return this.service.getInstallationByUser(githubAccount.externUsername)
  }

  @Query(() => PaginatedGithubInstallations, {
    name: 'associatedGithubInstallations',
    description:
      'List all installations associated with the github account connected by the current user, include joined organizations. Throws if user is not connected to github account. \n' +
      'NOTE: Limited by github endpoint, pagination.skip must be a multiple of pagination.first for this function. pagination.after is not supported.',
  })
  async getAssociatedGithubInstallations(
    @CurrentUser() user: User,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10, skip: 0 } })
    paginationInput: PaginationInput,
  ) {
    const githubAccount = await this.userService.getUserConnectedAccount(user, ExternalAccount.github)
    if (!githubAccount?.accessToken) {
      throw new UserError('Please connect your github account first.')
    }

    return this.service.getAssociatedInstallationsByUser(paginationInput, githubAccount.accessToken)
  }

  @Query(() => GithubRepoVerificationResult, {
    name: 'verifyGithubRepositoryPermission',
    description:
      'Verify that the github project exists and the current user has permissions to the project. Throws if user is not connected to github account.',
  })
  async verifyGithubRepositoryPermission(
    @CurrentUser() user: User,
    @Args({ name: 'owner', type: () => String }) owner: string,
    @Args({ name: 'repo', type: () => String }) repo: string,
  ) {
    return this.service.verifyGithubRepositoryPermission(user, owner, repo)
  }

  @Query(() => PaginatedGithubRepositories, {
    name: 'githubSearchRepositories',
    description:
      'Search github repositories in the installation.\n' +
      'Throws if user is not connected to github account.\n' +
      'NOTE: Limited by github endpoint, pagination.skip must be a multiple of pagination.first for this function. pagination.after is not supported.',
  })
  async searchGithubInstallationRepositories(
    @CurrentUser() user: User,
    @Args({ name: 'installationId', type: () => Int }) installationId: number,
    @Args({ name: 'query', type: () => String }) query: string,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10, skip: 0 } })
    paginationInput: PaginationInput,
  ) {
    const githubAccount = await this.userService.getUserConnectedAccount(user, ExternalAccount.github)
    if (!githubAccount?.accessToken) {
      throw new UserError('Please connect your github account first.')
    }

    const installation = await this.service.getInstallationById(installationId)
    const qualifier =
      (installation.account.type === 'Organization'
        ? `org:${installation.account.login}`
        : `user:${installation.account.login}`) + ' fork:true'
    const installationToken = await this.service.getInstallationAccessToken(installationId)
    const escapedQuery = '"' + query.split(/\s+/).join('" "') + '" ' + qualifier
    return this.service.searchRepositories(escapedQuery, paginationInput, installationToken)
  }
}
