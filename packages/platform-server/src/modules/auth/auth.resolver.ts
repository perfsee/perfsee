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

import { Resolver, Query, Args, Mutation, Parent, ResolveField } from '@nestjs/graphql'

import { AccessToken, User } from '@perfsee/platform-server/db'
import { ExternalAccount } from '@perfsee/shared'

import { Auth, CurrentUser, SkipAuth } from './auth.guard'
import { AuthService } from './auth.service'

@Auth()
@Resolver(() => User)
export class AuthResolver {
  constructor(private readonly service: AuthService) {}

  @ResolveField(() => [AccessToken])
  accessTokens(@Parent() user: User) {
    return this.service.getAllTokenRecords(user)
  }

  @Mutation(() => String)
  generateToken(@CurrentUser() user: User, @Args({ name: 'name', type: () => String }) name: string) {
    return this.service.generateToken(user, name)
  }

  @Mutation(() => Boolean)
  async deleteToken(@CurrentUser() user: User, @Args({ name: 'name', type: () => String }) name: string) {
    await this.service.invalidToken(user, name)

    return true
  }

  @SkipAuth('used by landing page')
  @Query(() => [ExternalAccount])
  availableOAuthProviders(): ExternalAccount[] {
    return this.service.availableOAuthProviders()
  }
}
