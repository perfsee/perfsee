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

import { DialogFooter, PrimaryButton, DefaultButton, Dropdown, IDropdownOption, Stack } from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { pick } from 'lodash'
import { useCallback, useState, FormEvent, useRef } from 'react'

import { RequiredTextField } from '@perfsee/components'

import { ProfileSchema, PropertyModule } from '../../../shared'
import { getDevicesOptions, getConnectionsOptions, DefaultConnection, DefaultDevice } from '../helper'

import { FormReact } from './form-react'

type FromProps = {
  profile: Partial<ProfileSchema>
  closeModal: () => void
  onSubmit: (payload: Partial<ProfileSchema>) => void
}

export const ProfileForm = (props: FromProps) => {
  const { profile: defaultProfile, closeModal, onSubmit } = props
  const reactProfilingRef = useRef<{ getReactProfilingEnable: () => boolean }>()
  const { connections, devices } = useModuleState(PropertyModule, {
    selector: (state) => pick(state, 'connections', 'devices'),
    dependencies: [],
  })

  const [profile, setProfile] = useState<Partial<ProfileSchema>>({
    device: DefaultDevice.id,
    bandWidth: DefaultConnection.id,
    ...defaultProfile,
  })

  const onSave = useCallback(
    (_e: any) => {
      const reactProfiling = reactProfilingRef.current!.getReactProfilingEnable()

      if (profile.name) {
        onSubmit({ ...profile, reactProfiling })
      }
    },
    [onSubmit, profile],
  )

  const onNameChange = useCallback((_: FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
    setProfile((profile) => ({ ...profile, name: value }))
  }, [])

  const onDropdownChange = useCallback((e: FormEvent<HTMLDivElement>, option?: IDropdownOption<any>) => {
    if (!e.target || option === undefined) {
      return
    }
    const type = (e.target as HTMLDivElement).dataset.type!
    setProfile((p) => ({ ...p, [type]: option.key }))
  }, [])

  return (
    <Stack tokens={{ childrenGap: 6 }}>
      <RequiredTextField label="Profile name" defaultValue={profile.name} onChange={onNameChange} />
      <Dropdown
        required={true}
        data-type="device"
        selectedKey={profile.device}
        label="Device emulation"
        onChange={onDropdownChange}
        options={getDevicesOptions(devices)}
      />
      <Dropdown
        required={true}
        data-type="bandWidth"
        selectedKey={profile.bandWidth}
        label="Connection speed"
        onChange={onDropdownChange}
        options={getConnectionsOptions(connections)}
      />
      <FormReact defaultEnable={defaultProfile?.reactProfiling ?? false} ref={reactProfilingRef} />
      <DialogFooter>
        <PrimaryButton onClick={onSave} text="Save" />
        <DefaultButton onClick={closeModal} text="Cancel" />
      </DialogFooter>
    </Stack>
  )
}
