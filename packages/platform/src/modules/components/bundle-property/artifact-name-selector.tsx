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
  defaultArtifactName?: string
  onChange: (branch: string | undefined) => void
}

export function ArtifactNameSelector({ onChange, defaultArtifactName }: Props) {
  const [{ artifactNames }, { getRecentArtifactNames }] = useModule(BundlePropertiesModule)
  const [currentArtifactName, setCurrentArtifactName] = useState<string>()

  const options = useMemo(() => {
    return artifactNames.map((name) => ({ key: name, text: name }))
  }, [artifactNames])

  const handleOnChange = useCallback(
    (key: string) => {
      onChange(key || undefined)
    },
    [onChange],
  )

  useEffect(() => {
    getRecentArtifactNames()
  }, [getRecentArtifactNames])

  useEffect(() => {
    if (
      artifactNames?.length &&
      currentArtifactName === undefined &&
      defaultArtifactName &&
      artifactNames.includes(defaultArtifactName)
    ) {
      setCurrentArtifactName(defaultArtifactName)
      onChange(defaultArtifactName)
    }
  }, [artifactNames, currentArtifactName, defaultArtifactName, onChange])

  return (
    <SearchSelect
      multiSelect={false}
      title="Artifact Name"
      allowFreeform
      placeholder="Filter by name"
      options={options}
      iconProps={DropDownIcon}
      value={currentArtifactName}
      onChange={handleOnChange}
    />
  )
}
