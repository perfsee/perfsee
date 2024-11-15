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

import {
  DialogFooter,
  PrimaryButton,
  DefaultButton,
  Dropdown,
  IDropdownOption,
  Stack,
  TextField,
} from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { pick } from 'lodash'
import { useCallback, useState, FormEvent, useRef } from 'react'

import { RequiredTextField } from '@perfsee/components'

import { ProfileSchema, PropertyModule } from '../../../shared'
import { getDevicesOptions, getConnectionsOptions, DefaultConnection, DefaultDevice } from '../helper'

import { FormProxy } from './form-proxy'
import { FormReact } from './form-react'
import { FormWarmup } from './form-warmup'

type FromProps = {
  profile: Partial<ProfileSchema>
  closeModal: () => void
  onSubmit: (payload: Partial<ProfileSchema>) => void
}

const LIGHTHOUSE_FLAGS_PLACEHOLDER = `Support: 'ignoreRedirection', 'pauseAfterLoadMs', 'pauseAfterFcpMs', 'networkQuietThresholdMs' and 'cpuQuietThresholdMs'.
e.g. { "pauseAfterLoadMs": 5000, "ignoreRedirection": true }`

export const ProfileForm = (props: FromProps) => {
  const { profile: defaultProfile, closeModal, onSubmit } = props
  const reactProfilingRef = useRef<{ getReactProfilingEnable: () => boolean }>()
  const proxyRef = useRef<{ getProxyEnable: () => boolean }>()
  const warmupRef = useRef<{ getEnable: () => boolean }>()
  const { connections, devices } = useModuleState(PropertyModule, {
    selector: (state) => pick(state, 'connections', 'devices'),
    dependencies: [],
  })

  const [profile, setProfile] = useState<Partial<ProfileSchema>>({
    device: DefaultDevice.id,
    bandWidth: DefaultConnection.id,
    ...defaultProfile,
  })

  const [flagsError, setFlagsError] = useState<string | undefined>(undefined)

  const onSave = useCallback(
    (_e: any) => {
      if (flagsError) {
        return
      }
      const reactProfiling = reactProfilingRef.current!.getReactProfilingEnable()
      const enableProxy = proxyRef.current!.getProxyEnable()
      const warmup = warmupRef.current!.getEnable()

      if (profile.name) {
        onSubmit({ ...profile, reactProfiling, enableProxy, warmup })
      }
    },
    [onSubmit, profile, flagsError],
  )

  const onNameChange = useCallback((_: FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
    setProfile((profile) => ({ ...profile, name: value }))
  }, [])

  const onUserAgentChange = useCallback((_: FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
    setProfile((profile) => ({ ...profile, userAgent: value }))
  }, [])

  const onLighthouseFlagsChange = useCallback(
    (_: FormEvent<HTMLInputElement | HTMLTextAreaElement>, value?: string) => {
      if ((value?.length || 0) >= 1000) {
        return setFlagsError('Too large')
      }
      try {
        const json = value && JSON.parse(value)
        setProfile((profile) => ({ ...profile, lighthouseFlags: value ? json : null }))
        setFlagsError(undefined)
      } catch {
        setFlagsError('Json invalid')
      }
    },
    [],
  )

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
      <TextField
        label="User agent"
        defaultValue={profile.userAgent ?? undefined}
        placeholder="The default user agent will be used"
        onChange={onUserAgentChange}
      />
      <TextField
        multiline
        label="Lighthouse running flags"
        rows={3}
        defaultValue={profile.lighthouseFlags ? JSON.stringify(profile.lighthouseFlags) : undefined}
        placeholder={LIGHTHOUSE_FLAGS_PLACEHOLDER}
        onChange={onLighthouseFlagsChange}
        errorMessage={flagsError}
      />
      <FormReact defaultEnable={defaultProfile?.reactProfiling ?? false} ref={reactProfilingRef} />
      <FormProxy defaultEnable={defaultProfile?.enableProxy ?? false} ref={proxyRef} />
      <FormWarmup defaultEnable={defaultProfile?.warmup ?? false} ref={warmupRef} />
      <DialogFooter>
        <PrimaryButton onClick={onSave} text="Save" />
        <DefaultButton onClick={closeModal} text="Cancel" />
      </DialogFooter>
    </Stack>
  )
}
