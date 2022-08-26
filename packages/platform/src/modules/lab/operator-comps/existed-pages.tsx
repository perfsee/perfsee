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

import { Checkbox, Stack, PrimaryButton, TextField, ResponsiveMode } from '@fluentui/react'
import { useDispatchers, useModuleState } from '@sigi/react'
import { FC, useCallback, useState, useMemo } from 'react'

import { MultiSelector } from '@perfsee/components'

import { PropertyModule } from '../../shared'
import { LabListModule } from '../list/module'

type Props = {
  onCloseModal: () => void
}

export const ExistedPages: FC<Props> = ({ onCloseModal }) => {
  const { pages, profiles, environments } = useModuleState(PropertyModule, {
    selector: (s) => ({
      pages: s.pages.filter((p) => !p.isCompetitor && !p.isTemp && !p.disable),
      profiles: s.profiles.filter((p) => !p.disable),
      environments: s.environments.filter((env) => !env.isCompetitor && !env.disable),
    }),
    dependencies: [],
  })

  const { takeSnapshot } = useDispatchers(LabListModule)

  const [pageIds, setPageIds] = useState<number[]>([])
  const [profileIds, setProfileIds] = useState<number[]>([])
  const [envIds, setEnvIds] = useState<number[]>([])
  const [specified, setChecked] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')

  const onTitleChange = useCallback((_: any, newValue?: string) => {
    setTitle(newValue ?? '')
  }, [])

  const onCheckChange = useCallback((_e: any, checked?: boolean) => {
    setChecked(!!checked)
  }, [])

  const disabled = useMemo(() => {
    if (!pageIds.length) {
      return true
    }

    if (!specified) {
      return false
    }

    return !profileIds.length || !envIds.length
  }, [pageIds.length, specified, profileIds.length, envIds.length])

  const onSave = useCallback(() => {
    if (disabled) {
      onCloseModal()
      return
    }

    const payload = { pageIds, title: title || null, commitHash: null }
    const specifiedPayload = specified ? { profileIds, envIds } : { profileIds: null, envIds: null }

    takeSnapshot({ ...payload, ...specifiedPayload })
    onCloseModal()
  }, [disabled, specified, pageIds, profileIds, envIds, title, takeSnapshot, onCloseModal])

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      <b>If any competitor pages were bound to selected page, they will be snapshotted at the same time.</b>
      <MultiSelector
        responsiveMode={pages.length > 5 ? ResponsiveMode.medium : undefined}
        label="Select pages"
        options={pages}
        ids={pageIds}
        onSelectChange={setPageIds}
      />
      <TextField label="Title" value={title} onChange={onTitleChange} />
      <Checkbox label="Specify config" checked={specified} onChange={onCheckChange} />
      {specified && (
        <Stack horizontal horizontalAlign="space-between">
          <MultiSelector label="Select Profiles" options={profiles} ids={profileIds} onSelectChange={setProfileIds} />
          <MultiSelector label="Select Environments" options={environments} ids={envIds} onSelectChange={setEnvIds} />
        </Stack>
      )}
      <PrimaryButton disabled={disabled} onClick={onSave}>
        Save
      </PrimaryButton>
    </Stack>
  )
}
