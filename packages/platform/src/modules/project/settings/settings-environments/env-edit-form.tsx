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
  Stack,
  IDropdownOption,
  ComboBox,
  IconButton,
  TooltipHost,
  TextField,
} from '@fluentui/react'
import { useModuleState } from '@sigi/react'
import { useCallback, useState, useRef, useEffect } from 'react'

import { RequiredTextField } from '@perfsee/components'
import { notify } from '@perfsee/platform/common'

import {
  CookieSchema,
  EnvSchema,
  PropertyModule,
  LocalStorageSchema,
  HeaderSchema,
  SessionStorageSchema,
} from '../../../shared'

import { FormCookies } from './form-cookies'
import { FormHeaders } from './form-headers'
import { FormLocalStorage } from './form-localstorage'
import { FormSessionStorage } from './form-sessionstorage'
import { LoginScriptForm } from './login-script-form'

type FromProps = {
  defaultEnv?: Partial<EnvSchema>
  closeModal: () => void
  isTable: boolean
  onSubmit: (payload: Partial<EnvSchema>) => void
  onPrewview?: (payload: Partial<EnvSchema>) => void
}

export const EnvEditForm = (props: FromProps) => {
  const { defaultEnv, closeModal, onSubmit, isTable } = props

  const { zones, defaultZone } = useModuleState(PropertyModule, {
    selector: (state) => ({
      zones: state.zones.map((zone) => ({ key: zone, text: zone })),
      defaultZone: state.defaultZone,
    }),
    dependencies: [],
  })

  const headersRef = useRef<{ getHeaders: () => HeaderSchema[] }>()
  const cookiesRef = useRef<{ getCookies: () => CookieSchema[] }>()
  const localStorageRef = useRef<{
    getLocalStorage: () => LocalStorageSchema[]
  }>()
  const sessionStorageRef = useRef<{
    getSessionStorage: () => SessionStorageSchema[]
  }>()
  const loginScriptRef = useRef<{
    getScript: () => string | null
  }>()

  const [jsonEnv, setJsonEnv] = useState<string>()
  const [tableEnvName, setTableEnvName] = useState<string | undefined>(defaultEnv?.name)
  const [zone, setZone] = useState(defaultEnv?.zone ?? defaultZone)
  const [errorMessage, setErrorMessage] = useState<string>()

  // init
  useEffect(() => {
    defaultEnv?.name && setTableEnvName(defaultEnv.name)
    defaultEnv?.zone && setZone(defaultEnv.zone)
  }, [defaultEnv])

  const getJsonPayload = useCallback(() => {
    if (!jsonEnv) {
      return
    }

    try {
      return JSON.parse(jsonEnv) as Partial<EnvSchema>
    } catch (error) {
      setErrorMessage('Invalid json')
    }
  }, [jsonEnv])

  const getTablePayload = useCallback(() => {
    const cookies = cookiesRef.current!.getCookies()
    const headers = headersRef.current!.getHeaders()
    const localStorage = localStorageRef.current!.getLocalStorage()
    const sessionStorage = sessionStorageRef.current!.getSessionStorage()
    const loginScript = loginScriptRef.current!.getScript()

    return {
      name: tableEnvName,
      headers,
      cookies,
      localStorage,
      sessionStorage,
      zone,
      loginScript,
    }
  }, [tableEnvName, zone])

  const onPrewview = useCallback(() => {
    const payload = getJsonPayload()

    if (!payload) {
      return
    }

    if (!payload.name) {
      setErrorMessage('Name is Required.')
      return
    }

    // Not allowed to save
    if (payload.loginScript === '') {
      setErrorMessage('loginScript cannot be an empty string.')
      return
    }

    if (!zones.some((z) => z.key === payload.zone)) {
      setErrorMessage('Zone is invalid')
      return
    }

    props.onPrewview?.(payload)
  }, [getJsonPayload, props, zones])

  const onSave = useCallback(
    (_e: any) => {
      const payload = getTablePayload()
      if (!payload) {
        return
      }

      // Not allowed to save
      if (!payload.name || payload.loginScript === '') {
        return
      }

      if (!zones.some((z) => z.key === payload.zone)) {
        return
      }

      const needReminder = payload?.cookies?.some((c) => !!c.expire)

      onSubmit({
        needReminder,
        ...payload,
      })
    },
    [getTablePayload, zones, onSubmit],
  )

  const onCopy = useCallback(() => {
    const payload = getTablePayload()

    navigator.clipboard
      .writeText(JSON.stringify({ ...payload, id: undefined })) // do not copy id
      .then(() => {
        notify.success({ content: 'Copied', duration: 3000 })
      })
      .catch(() => {
        notify.error({ content: 'Copy failed, please copy it manually.' })
      })
  }, [getTablePayload])

  const onZoneChange = useCallback((_: any, option?: IDropdownOption) => {
    if (!option) {
      return
    }

    setZone(option.key as string)
  }, [])

  const onJsonChange = useCallback((_: any, value?: string) => {
    setErrorMessage(undefined)
    setJsonEnv(value)
  }, [])

  const onNameChange = useCallback((_: any, value?: string) => {
    setTableEnvName(value)
  }, [])

  const innerTable = (
    <>
      <RequiredTextField id="name" label="Environment name" value={tableEnvName} onChange={onNameChange} />
      <FormHeaders defaultHeaders={defaultEnv?.headers ?? []} ref={headersRef} />
      <FormCookies defaultCookies={defaultEnv?.cookies ?? []} ref={cookiesRef} />
      <FormLocalStorage defaultLocalStorage={defaultEnv?.localStorage ?? []} ref={localStorageRef} />
      <FormSessionStorage defaultSessionStorage={defaultEnv?.sessionStorage ?? []} ref={sessionStorageRef} />
      <ComboBox
        required
        label="Zone"
        selectedKey={zone}
        options={zones}
        onChange={onZoneChange}
        useComboBoxAsMenuWidth
      />
      <LoginScriptForm defaultScript={defaultEnv?.loginScript} ref={loginScriptRef} />
    </>
  )

  const innerJson = (
    <TextField
      errorMessage={errorMessage}
      onChange={onJsonChange}
      value={jsonEnv}
      placeholder='{"name": "name", "headers": []}'
      multiline={true}
      styles={{ field: { height: '200px' } }}
    />
  )

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      {isTable ? innerTable : innerJson}
      <Stack tokens={{ childrenGap: 8 }} horizontal horizontalAlign="space-between" verticalAlign="end">
        <DialogFooter>
          {isTable && (
            <TooltipHost content="Export the environment configuration as JSON format">
              <IconButton iconProps={{ iconName: 'ExportOutlined' }} onClick={onCopy} />
            </TooltipHost>
          )}
          {!isTable && <PrimaryButton disabled={!jsonEnv} onClick={onPrewview} text="Preview" />}
          {isTable && <PrimaryButton onClick={onSave} text="Save" />}
          <DefaultButton onClick={closeModal} text="Cancel" />
        </DialogFooter>
      </Stack>
    </Stack>
  )
}
