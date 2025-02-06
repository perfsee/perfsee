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

import { ForbiddenException } from '@nestjs/common'
import {
  Resolver,
  Query,
  ResolveField,
  Parent,
  Mutation,
  Args,
  ObjectType,
  Field,
  GraphQLISODateTime,
} from '@nestjs/graphql'
import GraphQLJSON from 'graphql-type-json'

import { User } from '@perfsee/platform-server/db'
import { ExternalAccount } from '@perfsee/shared'

import { CurrentUser, Auth } from '../auth/auth.guard'

import { UserService } from './service'
import { SearchUserResult } from './types'

@ObjectType()
export class Account {
  @Field(() => ExternalAccount)
  provider!: ExternalAccount

  @Field(() => String, { nullable: true })
  externUsername?: string
}

@Resolver(() => User)
export class CurrentUserResolver {
  @Query(() => User, { nullable: true })
  user(@CurrentUser() user: User) {
    return user
  }
}

@Auth()
@Resolver(() => User)
export class UserResolver {
  constructor(private readonly service: UserService) {}

  @Query(() => [SearchUserResult])
  searchUsers(@Args({ name: 'query', type: () => String }) _query: string) {
    // TODO: search with https://docs.github.com/en/rest/users/users#get-a-user
    return []
  }

  @Mutation(() => Boolean)
  async assignAdmin(@CurrentUser() user: User, @Args({ name: 'email', type: () => String }) email: string) {
    if (!user.isAdmin) {
      throw new ForbiddenException('Forbidden operation')
    }

    await this.service.setAdmin(email)
    return true
  }

  @ResolveField(() => [Account])
  async connectedAccounts(@Parent() user: User): Promise<Account[]> {
    const connected = await this.service.getUserConnectedAccounts(user)

    return Object.values(ExternalAccount).map((provider) => {
      const account = connected.find((account) => account.provider === provider)

      return {
        provider: provider,
        externUsername: account ? account.externUsername : undefined,
      }
    })
  }

  @Mutation(() => Boolean)
  async disconnectAccount(
    @CurrentUser() user: User,
    @Args({ name: 'provider', type: () => ExternalAccount }) provider: ExternalAccount,
  ) {
    await this.service.disconnectAccount(user, provider)

    return true
  }

  @ResolveField(() => GraphQLJSON, { nullable: true })
  async userCookies(@CurrentUser() user: User) {
    return this.service.getUserCookies(user.email)
  }

  @ResolveField(() => GraphQLISODateTime, { nullable: true })
  async userCookiesLastUpdate(@CurrentUser() user: User) {
    return this.service.getUserCookiesLastUpdate(user.id)
  }
}
