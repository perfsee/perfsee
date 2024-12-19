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
import { useCallback, useEffect, useMemo, useState } from 'react'

import { SearchSelect } from '@perfsee/components'

import { BundlePropertiesModule } from '../../shared'

import { DropDownIcon } from './styled'

interface Props {
  defaultEntrypoints?: string
  artifactName?: string
  branch?: string
  onChange: (entrypoint?: string) => void
}

export function EntrypointSelector({ onChange, defaultEntrypoints, artifactName, branch }: Props) {
  const [{ entrypoints }, { getEntrypoints }] = useModule(BundlePropertiesModule)
  const [currentEntrypoint, setCurrentEntrypoints] = useState<string | undefined>(defaultEntrypoints)

  const options = useMemo(() => {
    return entrypoints.map((entry) => ({ key: entry, text: entry }))
  }, [entrypoints])

  const onSelect = useCallback(
    (keys: string | undefined) => {
      setCurrentEntrypoints(keys)
      onChange(keys)
    },
    [onChange],
  )

  useEffect(() => {
    getEntrypoints({
      artifactName,
      branch,
    })
  }, [getEntrypoints, artifactName, branch])

  return (
    <SearchSelect
      allowFreeform
      title="Entrypoint"
      placeholder="Filter by entrypoints"
      options={options}
      iconProps={DropDownIcon}
      value={currentEntrypoint}
      onChange={onSelect}
    />
  )
}
