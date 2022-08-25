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

import { ModuleMetadata } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { TypeOrmModule } from '@nestjs/typeorm'
import { DataSource } from 'typeorm'

import { dataSource } from '../datasource'
import { DBService, mysqlEntities } from '../db'
import { seed as seedDB } from '../db/fixtures'

const TypeOrmTestingModule = () => [
  TypeOrmModule.forRootAsync({
    useFactory: () => ({}),
    dataSourceFactory: () => {
      return Promise.resolve(dataSource)
    },
  }),
  TypeOrmModule.forFeature(mysqlEntities),
]

async function truncateTables(conn: DataSource) {
  await conn.transaction(async (manager) => {
    await Promise.all(mysqlEntities.map((entity) => manager.clear(entity)))
    // TODO: re-enable foreign key constraint
    // await manager.query('SET FOREIGN_KEY_CHECKS = 1;')
  })
}

export async function initTestDB(seed = true) {
  if (!dataSource.isInitialized) {
    await dataSource.initialize()
  }

  // disable foreign key constraint during testing,
  // which will prevent us from truncating tables before each test
  await dataSource.query('SET GLOBAL FOREIGN_KEY_CHECKS = 0;')
  await truncateTables(dataSource)

  if (seed) {
    await seedDB()
  }

  return dataSource
}

export const createDBTestingModule = (metadata: ModuleMetadata) => {
  return Test.createTestingModule({
    ...metadata,
    imports: [...(metadata.imports ?? []), ...TypeOrmTestingModule()],
    providers: [...(metadata.providers ?? []), DBService],
  })
}
export * from '../db/fixtures'
