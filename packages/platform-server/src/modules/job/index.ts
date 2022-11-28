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

import { ProjectUsageModule } from '../project-usage'
import { RunnerModule } from '../runner'

import { JobController } from './controller'
import { JobResolver, RunnerJobResolver, ProjectJobResolver } from './resolver'
import { JobService } from './service'

@Module({
  imports: [DBModule, StorageModule, RunnerModule, ProjectUsageModule],
  controllers: [JobController],
  providers: [JobService, JobResolver, RunnerJobResolver, ProjectJobResolver],
  exports: [JobService],
})
export class JobModule {}
export { JobService }
