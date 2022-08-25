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

import { ObjectStorage, LogObjectStorage } from './providers/local'

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
  provide: ObjectStorage,
  useFactory: () => {
    return new ObjectStorage()
  },
}

const logProvider: FactoryProvider = {
  provide: LogObjectStorage,
  useFactory: () => {
    return new LogObjectStorage()
  },
}

@Module({
  providers: [artifactProvider, logProvider],
  exports: [artifactProvider, logProvider],
})
export class StorageModule {}

export { ObjectStorage, LogObjectStorage as JobLogStorage }
