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

import { DynamicModule } from '@nestjs/common'
import config from 'config'

export type ConfigType = typeof config
export type ConfigFieldGetter = <K extends keyof ConfigType>(key: K) => ConfigType[K]

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
export class Config extends ApplyType<ConfigType>() {
  constructor(private readonly config: ConfigType) {
    super()
  }

  getter: ConfigFieldGetter = (key) => {
    return this.config[key]
  }
}

const createConfigProvider = (overrideConfig?: Partial<Config>) => ({
  provide: Config,
  useFactory: () => {
    const c = new Config({ ...config, ...overrideConfig })
    return new Proxy(c, {
      get: (target, prop: keyof Config) => {
        if (prop === 'getter') {
          return target[prop]
        }

        return target.getter.call(target, prop)
      },
    })
  },
})

export class ConfigModule {
  static forRoot = (overrideConfig?: Partial<Config>): DynamicModule => {
    const provider = createConfigProvider(overrideConfig)

    return {
      global: true,
      module: ConfigModule,
      providers: [provider],
      exports: [provider],
    }
  }
}
