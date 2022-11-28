import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'

import { UsagePack } from '@perfsee/platform-server/db'

import { Auth } from '../auth'

import { UsagePackService } from './service'
import { CreateUsagePackInput, UpdateUsagePackInput } from './types'

@Resolver(() => UsagePack)
@Auth('admin')
export class UsagePackResolver {
  constructor(private readonly service: UsagePackService) {}

  @Query(() => [UsagePack])
  allUsagePacks() {
    return this.service.getPacks()
  }

  @Query(() => [UsagePack])
  publicUsagePacks() {
    return this.service.getPacks(false)
  }

  @Mutation(() => UsagePack)
  createUsagePack(@Args({ name: 'input', type: () => CreateUsagePackInput }) input: CreateUsagePackInput) {
    return this.service.create(input)
  }

  @Mutation(() => UsagePack)
  updateUsagePack(@Args({ name: 'input', type: () => UpdateUsagePackInput }) input: UpdateUsagePackInput) {
    return this.service.update(input)
  }

  @Mutation(() => Boolean)
  async setDefaultUsagePack(@Args('id') id: number) {
    await this.service.setDefault(id)

    return true
  }
}
