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

import { IStackTokens, Stack } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useCallback } from 'react'

import { MultiSelector } from '@perfsee/components'

import { PropertyModule } from '../../../shared'

const tokens: IStackTokens = {
  childrenGap: 10,
}

export type PropertyPayload = {
  pageIds: number[]
  profileIds: number[]
  envIds: number[]
}

type Props = PropertyPayload & {
  onChange: (payload: PropertyPayload) => void
}

export function SettingScheduleSelectors(props: Props) {
  const { pages, profiles, environments } = useModuleState(PropertyModule)
  const { pageIds, profileIds, envIds, onChange } = props

  const onChangeEnvType = useCallback(
    (ids: number[]) => {
      onChange({ envIds: ids, profileIds, pageIds })
    },
    [onChange, pageIds, profileIds],
  )
  const onChangePageIds = useCallback(
    (ids: number[]) => {
      onChange({ envIds, profileIds, pageIds: ids })
    },
    [envIds, onChange, profileIds],
  )
  const onChangeProfileIds = useCallback(
    (ids: number[]) => {
      onChange({ envIds, profileIds: ids, pageIds })
    },
    [envIds, onChange, pageIds],
  )

  return (
    <Stack tokens={tokens} horizontal>
      <MultiSelector
        options={pages
          .filter((p) => !p.isCompetitor && !p.isTemp)
          .map((p) => ({ id: p.id, name: `${p.name} ${p.disable ? '(disabled)' : ''}` }))}
        ids={pageIds}
        onSelectChange={onChangePageIds}
        placeholder="Select monitor pages"
        tips="It will create a snapshot for these pages and their competitor pages every time a schedule is executed."
        label="Pages"
      />

      <MultiSelector
        options={profiles.map((p) => ({ id: p.id, name: `${p.name} ${p.disable ? '(disabled)' : ''}` }))}
        ids={profileIds}
        onSelectChange={onChangeProfileIds}
        placeholder="Select monitor profiles"
        label="Profiles"
      />
      <MultiSelector
        options={environments
          .filter((env) => !env.isCompetitor)
          .map((env) => ({ id: env.id, name: `${env.name} ${env.disable ? '(disabled)' : ''}` }))}
        ids={envIds}
        onSelectChange={onChangeEnvType}
        label="Environments"
        placeholder="Select monitor Environments"
      />
    </Stack>
  )
}
