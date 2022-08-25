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

import { IChoiceGroupOption } from '@fluentui/react'

export type OptionType<T> = Pick<IChoiceGroupOption, 'key' | 'text'> & {
  item: T
}

export const formatSelectorOptions = <T extends { id: number; name: string }>(items: T[], set: Set<number>) => {
  return items
    .filter((item) => set.has(item.id))
    .map((item) => {
      return {
        key: `snapshot-${item.id}`,
        text: item.name,
        item,
      } as OptionType<T>
    })
}
