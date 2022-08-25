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

import { Module, ModuleMetadata } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { ThrottlerModule } from '@nestjs/throttler'

import { ConfigModule } from './config'
import { CronModule } from './cron'
import { DBModule } from './db'
import { EventModule } from './event'
import { GqlModule } from './graphql.module'
import { HelpersModule } from './helpers'
import { LoggerModule } from './logger'
import { MetricsModule } from './metrics'
import {
  ArtifactModule,
  ProjectModule,
  ProfileModule,
  PageModule,
  UserModule,
  FileModule,
  EnvironmentModule,
  HealthModule,
  MaintenanceModule,
  AuthModule,
  SnapshotModule,
  PermissionModule,
  SettingModule,
  TimerModule,
  SourceModule,
  JobModule,
  AppVersionModule,
  ApplicationModule,
  RunnerModule,
  ApplicationSettingModule,
  RunnerScriptModule,
} from './modules'
import { RedisModule } from './redis'
import { RestfulModule } from './restful.module'
import { StaticModule } from './static.module'
import { StorageModule } from './storage'

const baseModules: ModuleMetadata['imports'] = [
  ...DBModule.forRoot(),
  ConfigModule.forRoot(),
  ScheduleModule.forRoot(),
  ThrottlerModule.forRoot(),
  EventModule,
  CronModule,
  GqlModule,
  RestfulModule,
  StaticModule,
]

const functionalityModules: ModuleMetadata['imports'] = [
  HelpersModule,
  MetricsModule,
  PermissionModule,
  RedisModule,
  LoggerModule,
  MaintenanceModule,
  RedisModule,
  StorageModule,
  HealthModule,
]

const businessModules: ModuleMetadata['imports'] = [
  FileModule,
  ProjectModule,
  ArtifactModule,
  SnapshotModule,
  EnvironmentModule,
  ProfileModule,
  PageModule,
  AuthModule,
  UserModule,
  SettingModule,
  TimerModule,
  SourceModule,
  AppVersionModule,
  ApplicationModule,
  ApplicationSettingModule,
  RunnerScriptModule,
  RunnerModule,
  JobModule,
]

@Module({
  imports: [...baseModules, ...functionalityModules, ...businessModules],
})
export class AppModule {}
