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

import { isEqual } from 'lodash'
import { parse, stringify } from 'query-string'
import { useCallback, useMemo } from 'react'
import { useHistory, useLocation } from 'react-router'

interface QueryStringConfig {
  parseNumbers?: boolean
}

export function useQueryString<T extends Record<string, unknown>>(
  config?: QueryStringConfig,
): [Partial<T>, (patch: Partial<T>, replace?: boolean, forceUpdate?: boolean) => void] {
  // location in history somehow never updates, so we have to use the location directly
  const location = useLocation()
  const history = useHistory()

  const queryStrings = useMemo(
    () => parse(location.search, { parseBooleans: true, parseNumbers: config?.parseNumbers ?? true }),
    [config?.parseNumbers, location.search],
  ) as Partial<T>

  const updateQueryStrings = useCallback(
    (patch: Partial<T>, replace = false, forceUpdate = false) => {
      const oldQueryStrings = parse(location.search, {
        parseBooleans: true,
        parseNumbers: config?.parseNumbers,
      })
      const newQueryStrings = { ...oldQueryStrings, ...patch }

      if (forceUpdate || !isEqual(oldQueryStrings, newQueryStrings)) {
        const search = stringify(newQueryStrings)

        const newState = {
          search,
        }

        if (replace) {
          history.replace(newState)
        } else {
          history.push(newState)
        }
      }
    },
    [config?.parseNumbers, history, location.search],
  )

  return [queryStrings, updateQueryStrings]
}
