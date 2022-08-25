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
}

@ObjectType()
class GithubInstallation {
  @Field(() => Int)
  id!: number
  @Field(() => GithubAccount)
  account!: GithubAccount
}

@ObjectType()
export class PaginatedGithubInstallations extends Paginated(GithubInstallation) {}

@Auth()
@Resolver()
export class GithubIntegrationResolver {
  constructor(private readonly userService: UserService, private readonly service: GithubService) {}

  @Query(() => PaginatedGithubInstallations, {
    name: 'githubInstallations',
    description:
      'List all installations of the github account connected by the current user. Throws if user is not connected to github account. \n' +
      'NOTE: Limited by github endpoint, pagination.skip must be a multiple of pagination.first for this function. pagination.after is not supported.',
  })
  async getGithubInstallations(
    @CurrentUser() user: User,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10 } })
    paginationInput: PaginationInput,
  ) {
    const githubAccount = await this.userService.getUserConnectedAccount(user, ExternalAccount.github)
    if (!githubAccount || !githubAccount.accessToken) {
      throw new UserError('Please connect your github account first.')
    }

    return this.service.getInstallationsByUser(paginationInput, githubAccount.accessToken)
  }

  @Query(() => PaginatedGithubRepositories, {
    name: 'githubInstallationRepositories',
    description:
      'List all github repositories in the installation. Throws if user is not connected to github account. \n' +
      'NOTE: Limited by github endpoint, pagination.skip must be a multiple of pagination.first for this function. pagination.after is not supported.',
  })
  async getGithubInstallationRepositories(
    @CurrentUser() user: User,
    @Args({ name: 'installationId', type: () => Int }) installationId: number,
    @Args({ name: 'pagination', nullable: true, defaultValue: { first: 10 } })
    paginationInput: PaginationInput,
  ) {
    const githubAccount = await this.userService.getUserConnectedAccount(user, ExternalAccount.github)
    if (!githubAccount || !githubAccount.accessToken) {
      throw new UserError('Please connect your github account first.')
    }

    return this.service.getUserInstallationRepositories(paginationInput, installationId, githubAccount.accessToken)
  }
}
