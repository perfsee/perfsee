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

import { StringifiableRecord, stringifyUrl } from 'query-string'
import { useCallback } from 'react'
import { useParams } from 'react-router'

interface ProjectRouteParam {
  projectId: string
}

type ProjectRouteFn<T> = (param: T & ProjectRouteParam) => string

export const useGenerateProjectRoute = () => {
  const { projectId } = useParams<{ projectId: string }>()

  return useCallback(
    <T>(routeFn: ProjectRouteFn<T>, data: T, query?: StringifiableRecord) => {
      const params = { projectId, ...data }
      const path = routeFn.apply(null, [params])

      return stringifyUrl({ url: path, query })
    },
    [projectId],
  )
}
