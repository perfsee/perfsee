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
  ITextField,
  Stack,
  IDropdownOption,
  ComboBox,
} from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useCallback, useState, useRef } from 'react'

import { RequiredTextField } from '@perfsee/components'
import { CookieType, HeaderType, LocalStorageType } from '@perfsee/shared'

import { EnvSchema, PropertyModule } from '../../../shared'

import { FormCookies } from './form-cookies'
import { FormHeaders } from './form-headers'
import { FormLocalStorage } from './form-localstorage'

type FromProps = {
  defaultEnv?: EnvSchema
  closeModal: () => void
  onSubmit: (payload: Partial<EnvSchema>) => void
}

export const EnvEditForm = (props: FromProps) => {
  const { defaultEnv, closeModal, onSubmit } = props
  const { zones, defaultZone } = useModuleState(PropertyModule, {
    selector: (state) => ({
      zones: state.zones.map((zone) => ({ key: zone, text: zone })),
      defaultZone: state.defaultZone,
    }),
    dependencies: [],
  })

  const nameRef = useRef<ITextField>({ value: '' } as any)
  const headersRef = useRef<{ getHeaders: () => HeaderType[] }>()
  const cookiesRef = useRef<{ getCookies: () => CookieType[] }>()
  const localStorageRef = useRef<{ getLocalStorage: () => LocalStorageType[] }>()
  const [zone, setZone] = useState(defaultEnv?.zone ?? defaultZone)

  const onSave = useCallback(
    (_e: any) => {
      const name = nameRef.current.value
      const cookies = cookiesRef.current!.getCookies()
      const headers = headersRef.current!.getHeaders()
      const localStorage = localStorageRef.current!.getLocalStorage()

      // Not allowed to save
      if (!name) {
        return
      }

      const needReminder = cookies.some((c) => !!c.expire)
      onSubmit({
        id: defaultEnv?.id,
        name,
        headers,
        cookies,
        localStorage,
        needReminder,
        zone,
      })
    },
    [onSubmit, defaultEnv, zone],
  )

  const onZoneChange = useCallback((_: any, option?: IDropdownOption) => {
    if (!option) {
      return
    }

    setZone(option.key as string)
  }, [])

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      <RequiredTextField id="name" label="Environment name" defaultValue={defaultEnv?.name} componentRef={nameRef} />
      <FormHeaders defaultHeaders={defaultEnv?.headers ?? []} ref={headersRef} />
      <FormCookies defaultCookies={(defaultEnv?.cookies ?? []) as CookieType[]} ref={cookiesRef} />
      <FormLocalStorage defaultLocalStorage={defaultEnv?.localStorage ?? []} ref={localStorageRef} />
      <ComboBox label="Zone" selectedKey={zone} options={zones} onChange={onZoneChange} useComboBoxAsMenuWidth />
      <Stack tokens={{ childrenGap: 8 }} horizontal horizontalAlign="space-between" verticalAlign="end">
        <DialogFooter>
          <PrimaryButton onClick={onSave} text="Save" />
          <DefaultButton onClick={closeModal} text="Cancel" />
        </DialogFooter>
      </Stack>
    </Stack>
  )
}
