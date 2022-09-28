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

import { DynamicModule, FactoryProvider } from '@nestjs/common'
import { merge } from 'lodash'

import { DeepPartial } from '../utils/types'

import { PerfseeConfig } from './def'

type ConstructorOf<T> = {
  new (): T
}

function ApplyType<T>(): ConstructorOf<T> {
  // @ts-expect-error used to fake the type of config
  return class Inner implements T {
    constructor() {}
  }
}

/**
 * usage:
 * ```
 * import { Config } from '@perfsee/server-common'
 *
 * class TestConfig {
 *   constructor(private readonly config: Config) {}
 *   test() {
 *     return this.config.mysql.host
 *   }
 * }
 * ```
 */
export class Config extends ApplyType<PerfseeConfig>() {}

function createConfigProvider(override?: DeepPartial<Config>): FactoryProvider<Config> {
  return {
    provide: Config,
    useFactory: () => {
      const wrapper = new Config()
      const config = merge({}, perfsee, override)

      const proxy: Config = new Proxy(wrapper, {
        get: (_target, property: keyof Config) => {
          const desc = Object.getOwnPropertyDescriptor(perfsee, property)
          if (desc?.get) {
            return desc.get.call(proxy)
          }
          return config[property]
        },
      })
      return proxy
    },
  }
}

export class ConfigModule {
  static forRoot = (override?: DeepPartial<Config>): DynamicModule => {
    const provider = createConfigProvider(override)

    return {
      global: true,
      module: ConfigModule,
      providers: [provider],
      exports: [provider],
    }
  }
}

export { PerfseeConfig } from './def'
