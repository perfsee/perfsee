import { Injectable, OnApplicationBootstrap } from '@nestjs/common'

import { DBService, UsagePack } from '@perfsee/platform-server/db'

import { CreateUsagePackInput, UpdateUsagePackInput } from './types'

@Injectable()
export class UsagePackService implements OnApplicationBootstrap {
  constructor(private readonly db: DBService) {}

  async onApplicationBootstrap() {
    await this.db.transaction(async (manager) => {
      const packCount = await manager.count(UsagePack)
      if (packCount < 1) {
        await manager.save(
          UsagePack.create({
            name: 'Unlimited',
            desc: 'Unlimited plan',
            isDefault: true,
            storage: -1,
            jobCountMonthly: -1,
            jobDurationMonthly: -1,
          }),
          { reload: false },
        )
      }
    })
  }

  getPacks(listAll = true) {
    return UsagePack.findBy(listAll ? {} : { isPublic: true })
  }

  create(input: CreateUsagePackInput) {
    return UsagePack.create<UsagePack>(input).save()
  }

  async update(input: UpdateUsagePackInput) {
    const pack = await UsagePack.findOneByOrFail({ id: input.id })
    return UsagePack.merge<UsagePack>(pack, input).save()
  }

  delete(id: number) {
    return UsagePack.delete(id)
  }

  async setDefault(id: number) {
    await this.db.transaction(async (manager) => {
      await manager.update(UsagePack, { isDefault: true }, { isDefault: false })
      await manager.update(UsagePack, { id }, { isDefault: true })
    })
  }
}
