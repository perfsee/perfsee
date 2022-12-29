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

import DataLoader from 'dataloader'
import { uniq } from 'lodash'

/**
 * Create a dataloader instance for a request and type
 *
 * Usage:
 *  userLoader = () => createDataLoader(users => getUsers(users), 'id');
 */
export function createDataLoader<K, V>(
  batchFn: (keys: K[]) => Promise<V[]>,
  indexField: keyof V | ((v: V) => string) = 'id' as any,
) {
  return new DataLoader<K, V | undefined>(
    (keys) => {
      return batchFn(uniq(keys)).then(normalizeBatchResults(keys, indexField))
    },
    { cache: false },
  )
}

function normalizeBatchResults<K, V>(keys: readonly K[], cacheKey: keyof V | ((v: V) => any)) {
  return (results: V[]) => {
    const indexedResults = new Map<K, V>()

    results.filter(Boolean).forEach((res) => {
      const key = typeof cacheKey === 'function' ? cacheKey(res) : res[cacheKey]

      indexedResults.set(key, res)
    })

    return keys.map((key) => indexedResults.get(key))
  }
}
