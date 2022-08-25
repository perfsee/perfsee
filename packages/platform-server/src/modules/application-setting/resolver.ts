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

import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'

import { ApplicationSetting } from '@perfsee/platform-server/db'

import { Auth } from '../auth'

import { ApplicationSettingService } from './service'
import { Zone } from './types'

@Auth()
@Resolver(() => Zone)
export class ZoneResolver {
  constructor(private readonly service: ApplicationSettingService) {}

  @Query(() => Zone)
  zone() {
    return this.service.getZones()
  }
}

@Auth('admin')
@Resolver(() => ApplicationSetting)
export class ApplicationSettingResolver {
  constructor(private readonly service: ApplicationSettingService) {}

  @Query(() => ApplicationSetting)
  applicationSetting() {
    return this.service.get()
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
}
