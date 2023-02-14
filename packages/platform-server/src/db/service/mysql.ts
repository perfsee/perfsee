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
import { InjectDataSource, InjectEntityManager } from '@nestjs/typeorm'
import { DataSource, EntityManager, EntityTarget, QueryRunner } from 'typeorm'
import { IsolationLevel } from 'typeorm/driver/types/IsolationLevel'

@Injectable()
export class DBService {
  constructor(
    @InjectDataSource() public readonly connection: DataSource,
    @InjectEntityManager() public readonly manager: EntityManager,
  ) {}

  columnName<T>(entity: EntityTarget<T>, propertyName: keyof T) {
    return this.connection.getMetadata(entity).findColumnWithPropertyName(propertyName as string)?.databasePath
  }

  repo<T>(entity: EntityTarget<T>) {
    return this.manager.getRepository(entity)
  }

  transaction<T>(
    runInTransaction: (entityManager: EntityManager) => Promise<T>,
    isolationLevel?: IsolationLevel,
  ): Promise<T> {
    return isolationLevel
      ? this.manager.transaction(isolationLevel, runInTransaction)
      : this.manager.transaction(runInTransaction)
  }

  async useMasterRunner<T>(runWithMaster: (runner: QueryRunner) => Promise<T>) {
    const runner = this.connection.createQueryRunner('master')
    try {
      return await runWithMaster(runner)
    } finally {
      await runner.release()
    }
  }
}
