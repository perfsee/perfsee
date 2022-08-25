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

import { Query, Mutation, Args, Resolver } from '@nestjs/graphql'

import { Auth } from '../auth'

import { MaintenanceService } from './service'

@Auth('admin')
@Resolver()
export class MaintenanceModeResolver {
  constructor(private readonly service: MaintenanceService) {}

  @Query(() => Boolean, { name: 'maintenanceMode' })
  getMaintenanceMode() {
    return this.service.isInMaintenanceMode
  }

  @Mutation(() => Boolean)
  async setMaintenanceMode(@Args({ name: 'isOpen', type: () => Boolean }) isOpen: boolean) {
    await this.service.update(isOpen)
    return true
  }
}
