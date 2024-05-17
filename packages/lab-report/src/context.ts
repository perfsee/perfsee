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

import React, { useContext } from 'react'

import { useQueryString as useRawQueryString } from '@perfsee/components'

export const LabQueryStringContext = React.createContext<
  [
    query?: Record<string, string>,
    updateQuery?: (
      patch: Record<string, string>,
      replace?: boolean | undefined,
      forceUpdate?: boolean | undefined,
    ) => void,
  ]
>([])

export const useQueryString = <T extends Record<string, string>>() => {
  const [queryString, updateQueryString] = useRawQueryString<T>()
  const [query, updateQuery] = useContext(LabQueryStringContext)

  if (query && updateQuery) {
    return [
      query as T,
      (patch: T, replace?: boolean, _forceUpdate?: boolean) => {
        if (replace) {
          updateQuery(patch)
        } else {
          updateQuery({ ...queryString, ...patch })
        }
      },
    ] as const
  }

  return [queryString as T, updateQueryString] as const
}
