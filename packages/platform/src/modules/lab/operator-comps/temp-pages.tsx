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

import { Stack, PrimaryButton, TextField } from '@fluentui/react'
import { useModuleState, useDispatchers } from '@sigi/react'
import { FC, useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { URLTextField, MultiSelector } from '@perfsee/components'
import { SharedColors } from '@perfsee/dls'
import { pathFactory } from '@perfsee/shared/routes'

import { PropertyModule, useProjectRouteGenerator } from '../../shared'
import { LabListModule } from '../list/module'

import { stackTokens } from './style'

type Props = {
  onCloseModal: () => void
}

export const TempPages: FC<Props> = (props) => {
  return (
    <Stack tokens={stackTokens}>
      <span>
        Temporary pages will be snapshotted only <b style={{ color: SharedColors.red10 }}>once</b>. They won't attending
        in project snapshots history charts.
      </span>
      <TableContent {...props} />
    </Stack>
  )
}

const TableContent: FC<Props> = ({ onCloseModal }) => {
  const { profiles, environments } = useModuleState(PropertyModule, {
    selector: (s) => ({
      profiles: s.profiles,
      environments: s.environments,
    }),
    dependencies: [],
  })

  const { takeTempSnapshot } = useDispatchers(LabListModule)
  const generateProjectRoute = useProjectRouteGenerator()

  const [page, setPage] = useState<{
    url?: string
    profileIds: number[]
    envId?: number
    oversea: boolean
    title?: string | null
  }>({
    profileIds: [],
    oversea: false,
  })

  const onURLChange = useCallback((url?: string) => {
    setPage((p) => ({ ...p, url: url }))
  }, [])

  const onTitleChange = useCallback((_: any, newValue?: string) => {
    setPage((p) => ({ ...p, title: newValue }))
  }, [])

  const onProfileChange = useCallback((ids: number[]) => {
    setPage((p) => ({ ...p, profileIds: ids }))
  }, [])

  const onEnvChange = useCallback((ids: number[]) => {
    const id = ids.length ? ids[0] : undefined
    setPage((p) => ({ ...p, envId: id }))
  }, [])

  const disabled = useMemo(() => {
    return !page.url || !page.envId || !page.profileIds.length
  }, [page])

  const onSave = useCallback(() => {
    takeTempSnapshot({
      url: page.url!,
      profileIds: page.profileIds,
      envId: page.envId!,
      oversea: page.oversea,
      // need it to be null when page.title === ''
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      title: page.title || null,
    })
    onCloseModal()
  }, [onCloseModal, page, takeTempSnapshot])

  if (!environments.length) {
    const link = generateProjectRoute(pathFactory.project.settings, { settingName: 'environments' })
    return <Link to={link}>Create a competitor environment first.</Link>
  }

  return (
    <>
      <Stack tokens={{ childrenGap: 8 }}>
        <URLTextField url={page.url} required={true} onChange={onURLChange} />
        <TextField label="Title" value={page.title ?? ''} onChange={onTitleChange} />
        <MultiSelector
          options={profiles}
          ids={page.profileIds}
          onSelectChange={onProfileChange}
          label="Profiles"
          errorMessage="Required"
        />
        <MultiSelector
          options={environments}
          ids={page.envId ? [page.envId] : []}
          onSelectChange={onEnvChange}
          multiSelect={false}
          label="Environment"
          errorMessage="Required"
        />
      </Stack>
      <PrimaryButton disabled={disabled} onClick={onSave}>
        Save
      </PrimaryButton>
    </>
  )
}
