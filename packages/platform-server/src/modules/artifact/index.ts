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

import { DBModule } from '@perfsee/platform-server/db'
import { StorageModule } from '@perfsee/platform-server/storage'

import { AppVersionModule } from '../app-version'
import { CheckSuiteModule } from '../checksuite'
import { JobModule } from '../job'
import { NotificationModule } from '../notification'
import { ProjectModule } from '../project'
import { ScriptFileModule } from '../script-file'
import { SettingModule } from '../setting'

import { ArtifactController } from './controller'
import { ArtifactResolver, ProjectArtifactResolver, ArtifactEntrypointResolver } from './resolver'
import { ArtifactService } from './service'

@Module({
  imports: [
    DBModule,
    StorageModule,
    AppVersionModule,
    ProjectModule,
    JobModule,
    CheckSuiteModule,
    NotificationModule,
    ScriptFileModule,
    SettingModule,
  ],
  controllers: [ArtifactController],
  providers: [ArtifactService, ArtifactResolver, ProjectArtifactResolver, ArtifactEntrypointResolver],
  exports: [ArtifactService],
})
export class ArtifactModule {}
