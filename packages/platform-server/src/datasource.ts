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

import './prelude'
import { join } from 'path'

import { DataSource } from 'typeorm'

import { mysqlEntities } from './db/entities'
import { SnakeNamingStrategy } from './db/mysql/utils'

export const dataSource = new DataSource({
  ...perfsee.mysql,
  type: 'mysql',
  namingStrategy: new SnakeNamingStrategy(),
  entities: mysqlEntities,
  migrations: perfsee.deploy ? [] : [join(__dirname, '../../../db/migrations/*.ts')],
  migrationsTableName: 'typeorm_migration_table',
  migrationsRun: false,
  synchronize: false,
  logging: !!process.env.VERBOSE,
})
