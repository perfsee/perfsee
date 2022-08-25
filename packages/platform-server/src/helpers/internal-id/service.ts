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

import { Injectable } from '@nestjs/common'

import { DBService, InternalId, InternalIdUsage } from '@perfsee/platform-server/db'

@Injectable()
export class InternalIdService {
  constructor(private readonly db: DBService) {}

  /**
   * generate the next internal-id for given project and usage
   */
  async generate(projectId: number, usage: InternalIdUsage): Promise<number> {
    const iid = await this.update(projectId, usage, () => `\`${this.db.columnName(InternalId, 'lastValue')}\` + 1`)
    if (iid) {
      return iid
    }

    try {
      return await this.create(projectId, usage)
    } catch {
      // create by others
      return this.generate(projectId, usage)
    }
  }

  /**
   * Reset tries to rewind to `value-1`.
   *
   * This will only succeed if `last_value` stored in database is equal to `value`.
   * value: The expected last_value to decrement
   */
  async reset(projectId: number, usage: InternalIdUsage, value: number) {
    if (value < 1) {
      return false
    }

    const result = await InternalId.update(
      {
        projectId,
        usage,
        lastValue: value,
      },
      {
        lastValue: () => `\`${this.db.columnName(InternalId, 'lastValue')}\` - 1`,
      },
    )

    return result.affected === 1
  }

  /**
   * load the last value of internal-id for given project and usage.
   *
   * returns 0 if not yet registered
   */
  async load(projectId: number, usage: InternalIdUsage) {
    return this.db.useMasterRunner(async (runner) => {
      const iid = await this.db.connection
        .createQueryBuilder(InternalId, 'internalId', runner)
        .where({
          projectId,
          usage,
        })
        .getOne()

      return iid?.lastValue ?? 0
    })
  }

  /**
   * Create a record in internal_ids if one does not yet exist
   * and set its value if it is higher than the current last_value
   */
  async save(projectId: number, usage: InternalIdUsage, value: number): Promise<number> {
    const iid = await this.update(
      projectId,
      usage,
      () => `GREATEST(\`${this.db.columnName(InternalId, 'lastValue')}\`, ${value})`,
    )

    if (iid) {
      return iid
    }

    try {
      return await this.create(projectId, usage, value)
    } catch {
      // create by others
      return this.save(projectId, usage, value)
    }
  }

  private async create(projectId: number, usage: InternalIdUsage, value = 1) {
    const iid = await InternalId.create({
      projectId,
      usage,
      lastValue: value,
    }).save()

    return iid.lastValue
  }

  private async update(projectId: number, usage: InternalIdUsage, value: number | (() => string)) {
    return this.db.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .update(InternalId)
        .set({
          lastValue: value,
        })
        .where({
          projectId,
          usage,
        })
        .execute()

      const iid = await manager.findOneBy(InternalId, {
        projectId,
        usage,
      })
      return iid?.lastValue
    })
  }
}
