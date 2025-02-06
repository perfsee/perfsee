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

import { Module } from '@nestjs/common'

import { ConfigModule } from '@perfsee/platform-server/config'
import { DBModule } from '@perfsee/platform-server/db'
import { StorageModule } from '@perfsee/platform-server/storage'

import { AppVersionModule } from '../app-version'
import { EnvironmentModule } from '../environment'
import { PageModule } from '../page'
import { ProfileModule } from '../profile'
import { ProjectModule } from '../project'
import { ProjectUsageModule } from '../project-usage'
import { SourceModule } from '../source'
import { UserModule } from '../user'

import { SnapshotController } from './controller'
import { ProjectSnapshotResolver, SnapshotResolver } from './resolver'
import { SnapshotService } from './service'
import { SnapshotReportModule } from './snapshot-report'

@Module({
  imports: [
    DBModule,
    ProjectModule,
    PageModule,
    SnapshotReportModule,
    StorageModule,
    SourceModule,
    AppVersionModule,
    EnvironmentModule,
    ProfileModule,
    ProjectUsageModule,
    ConfigModule,
    UserModule,
  ],
  controllers: [SnapshotController],
  providers: [SnapshotResolver, ProjectSnapshotResolver, SnapshotService],
  exports: [SnapshotService],
})
export class SnapshotModule {}
