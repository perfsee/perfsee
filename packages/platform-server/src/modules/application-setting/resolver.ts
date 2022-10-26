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
import { Args, InputType, Mutation, Parent, PartialType, Query, ResolveField, Resolver } from '@nestjs/graphql'

import { Config } from '@perfsee/platform-server/config'
import { ApplicationSetting, User } from '@perfsee/platform-server/db'
import { ExternalAccount } from '@perfsee/shared'

import { Auth, CurrentUser } from '../auth'

import { ApplicationSettingService } from './service'
import { Zone } from './types'

@InputType()
class UpdateApplicationSettingsInput extends PartialType(ApplicationSetting, InputType) {}

@Auth()
@Resolver(() => Zone)
export class ZoneResolver {
  constructor(private readonly service: ApplicationSettingService) {}

  @Query(() => Zone)
  zone() {
    return this.service.getZones()
  }
}

@Resolver(() => ApplicationSetting)
export class PublicApplicationSettingResolver {
  constructor(private readonly service: ApplicationSettingService, private readonly config: Config) {}

  @Query(() => ApplicationSetting)
  applicationSettings() {
    return this.service.current()
  }

  @ResolveField(() => [ExternalAccount])
  oauthProviders() {
    return Object.keys(this.config.auth.oauthProviders)
  }
}

@Auth('admin')
@Resolver(() => ApplicationSetting)
export class AdminApplicationSettingResolver {
  constructor(private readonly service: ApplicationSettingService) {}

  @ResolveField(() => String)
  registrationToken(@Parent() settings: ApplicationSetting, @CurrentUser() user?: User) {
    if (!user?.isAdmin) {
      throw new ForbiddenException('Forbidden access')
    }

    return settings.registrationToken
  }

  @Mutation(() => String)
  resetRegistrationToken() {
    return this.service.resetRegistrationToken()
  }

  @Mutation(() => [String])
  insertAvailableJobZones(@Args({ name: 'zones', type: () => [String] }) zones: string[]) {
    return this.service.insertAvailableJobZones(zones)
  }

  @Mutation(() => [String])
  deleteAvailableJobZones(@Args({ name: 'zones', type: () => [String] }) zones: string[]) {
    return this.service.deleteAvailableJobZones(zones)
  }

  @Mutation(() => String)
  setDefaultJobZone(@Args('zone') zone: string) {
    return this.service.setDefaultJobZone(zone)
  }

  @Mutation(() => ApplicationSetting)
  updateApplicationSettings(
    @Args({ name: 'settings', type: () => UpdateApplicationSettingsInput }) patches: UpdateApplicationSettingsInput,
  ) {
    return this.service.update(patches)
  }
}
