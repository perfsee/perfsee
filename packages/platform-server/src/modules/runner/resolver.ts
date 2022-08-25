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

import { Args, Mutation, Resolver, Query, ResolveField, Parent, ID, ObjectType } from '@nestjs/graphql'

import { Runner } from '@perfsee/platform-server/db'
import { PaginatedType, paginate, Paginated, transformInputType } from '@perfsee/platform-server/graphql'

import { Auth } from '../auth'

import { longestOnlineContactedTime, RunnerService } from './service'
import { RunnerQueryFilter, UpdateRunnerInput } from './types'

@ObjectType()
class PaginatedRunners extends Paginated(Runner) {}

@Auth('admin')
@Resolver(() => Runner)
export class RunnerResolver {
  constructor(private readonly service: RunnerService) {}

  @Query(() => Runner, { name: 'runner' })
  async getRunner(@Args({ type: () => ID, name: 'id' }) uuid: string) {
    return this.service.getRunner(uuid)
  }

  @Query(() => PaginatedRunners, { name: 'runners' })
  async getRunners(
    @Args({ type: () => RunnerQueryFilter, name: 'filter' }) filter: RunnerQueryFilter,
  ): Promise<PaginatedType<Runner>> {
    const [runners, total] = await this.service.getRunners(filter)

    return paginate(runners, 'createdAt', filter, total)
  }

  @Mutation(() => Runner)
  async updateRunner(
    @Args({ type: () => ID, name: 'id' }) uuid: string,
    @Args({ name: 'input', type: () => UpdateRunnerInput }, transformInputType) input: UpdateRunnerInput,
  ) {
    const runner = await this.service.getRunner(uuid)
    return this.service.updateRunner(runner, input)
  }

  @Mutation(() => Boolean)
  async deleteRunner(@Args({ type: () => ID, name: 'id' }) uuid: string) {
    return this.service.deleteRunner(uuid)
  }

  @ResolveField(() => Boolean)
  online(@Parent() runner: Runner) {
    return runner.contactedAt > longestOnlineContactedTime()
  }
}
