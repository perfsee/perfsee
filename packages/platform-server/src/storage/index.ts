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

import { FactoryProvider, Module } from '@nestjs/common'

import { Config } from '../config'

import { S3Config, S3Storage } from './providers/aws'
import { ObjectStorage, LogObjectStorage } from './providers/local'
import { BaseObjectStorage } from './providers/provider'
import { FileSocketGateWay } from './socket'

/**
 * override in the way like:
 *
 * const artifactProvider: FactoryProvider = {
 *   provide: ObjectStorage,
 *   useFactory: (config: Config) => {
 *     return new CustomObjectStorage(config.storage)
 *   },
 *   inject: [Config],
 * }
 */
const artifactProvider: FactoryProvider = {
  provide: BaseObjectStorage,
  useFactory: (config: Config) => {
    if (config.objectStorage.enable && config.objectStorage.artifact.provider === 'aws') {
      return new S3Storage(config.objectStorage.artifact as unknown as S3Config)
    }
    return new ObjectStorage()
  },
  inject: [Config],
}

const logProvider: FactoryProvider = {
  provide: BaseObjectStorage,
  useFactory: (config: Config) => {
    if (config.objectStorage.enable && config.objectStorage.jobLog?.provider === 'aws') {
      return new S3Storage(config.objectStorage.jobLog as unknown as S3Config)
    }
    return new LogObjectStorage()
  },
  inject: [Config],
}

@Module({
  providers: [artifactProvider, logProvider, FileSocketGateWay],
  exports: [artifactProvider, logProvider],
})
export class StorageModule {}

export { BaseObjectStorage as ObjectStorage, BaseObjectStorage as JobLogStorage }
