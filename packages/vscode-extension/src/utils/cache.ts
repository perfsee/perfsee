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

import { memoize as rawMemoize, MapCache } from 'lodash'

class AutoDeleteCache implements MapCache {
  static instances: AutoDeleteCache[] = []

  map = new Map()
  timeoutMap = new Map()
  autoDelete = true

  constructor() {
    AutoDeleteCache.instances.push(this)
  }

  delete = (key: any) => this.map.delete(key)
  get = (key: any) => this.map.get(key)
  has = (key: any) => this.map.has(key)
  set = (key: any, value: any) => {
    this.map.set(key, value)

    if (this.autoDelete) {
      clearTimeout(this.timeoutMap.get(key))
      this.timeoutMap.set(
        key,
        setTimeout(() => {
          this.delete(key)
        }, 30000 /* 30s */),
      )
    }

    return this
  }
  clear = () => this.map.clear()
}

rawMemoize.Cache = AutoDeleteCache

export function clearAllMemoizeCache() {
  for (const cache of AutoDeleteCache.instances) {
    cache.clear()
  }
}

export function memoize<T extends (...args: any) => any>(
  f: T,
  resolver?: (...args: Parameters<T>) => any,
  autoDelete = true,
) {
  const memoized = rawMemoize(f, resolver)
  ;(memoized.cache as AutoDeleteCache).autoDelete = autoDelete
  return memoized
}

export function memoizePromise<T extends (...args: any) => PromiseLike<any>>(
  f: T,
  resolver: (...args: Parameters<T>) => any = ((a: any) => a) as any,
  autoDelete = true,
) {
  const memoizedFunction = rawMemoize(
    async function (this: any, ...args: Parameters<T>) {
      try {
        return await f.apply(this, args)
      } catch (e) {
        memoizedFunction.cache.delete(resolver(...args))
        throw e
      }
    } as any as T,
    resolver,
  )
  ;(memoizedFunction.cache as AutoDeleteCache).autoDelete = autoDelete
  return memoizedFunction
}
