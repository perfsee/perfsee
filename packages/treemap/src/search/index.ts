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

export interface Match {
  score: number
}

export interface SearchEngine<TData> {
  getMatch: (node: TData) => Match | null
}

export class NameSearchEngine implements SearchEngine<{ name?: string }> {
  private readonly cache = new WeakMap<{ name?: string }, Match | null>()
  private readonly query: string

  constructor(query: string) {
    this.query = query.toLowerCase()
  }

  getMatch(node: { name?: string }): Match | null {
    const cachedMatch = this.cache.get(node)
    if (cachedMatch !== undefined) {
      return cachedMatch
    }
    const match = node.name?.toLowerCase().includes(this.query)
    const result = match ? { score: 1 } : null
    this.cache.set(node, result)
    return result
  }
}
