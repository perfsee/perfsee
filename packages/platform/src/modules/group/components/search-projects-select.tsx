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

import { useModule } from '@sigi/react'
import { debounce } from 'lodash'
import { useState, useCallback, useMemo, useEffect } from 'react'

import { SearchSelect } from '@perfsee/components'

import { CreateGroupModule } from '../../shared'

type Props<T1 extends boolean> = {
  placeholder?: string
  multiSelect?: T1
  selectedProject?: string
  selectedProjects?: string[]
  onSelect: (selected: T1 extends true ? string[] : string) => void
}

export const SearchProjectsSelect = <T1 extends boolean = true>({
  placeholder,
  multiSelect,
  selectedProject,
  selectedProjects,
  onSelect,
}: Props<T1>) => {
  const [{ projects }, { getProjects }] = useModule(CreateGroupModule)
  const [query, setQuery] = useState<string>('')

  useEffect(() => {
    getProjects({ query })
  }, [getProjects, query])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const onKeywordChange = useCallback(
    debounce((searchValue?: string) => {
      setQuery(searchValue ?? '')
    }, 300),
    [],
  )

  const projectOptions = useMemo(() => {
    return projects.map((p) => {
      return {
        key: p.id,
        text: `${p.id} (${p.namespace}/${p.name})`,
      }
    })
  }, [projects])

  return (
    <SearchSelect
      required={true}
      query={query}
      multiSelect={multiSelect}
      options={projectOptions}
      selectOptions={projectOptions}
      value={selectedProject}
      values={selectedProjects}
      onKeywordChange={onKeywordChange}
      onChange={onSelect}
      label="Projects"
      placeholder={placeholder}
    />
  )
}
