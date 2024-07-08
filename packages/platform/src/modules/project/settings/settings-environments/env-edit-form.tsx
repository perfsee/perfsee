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
import { useCallback, useState, useRef, useEffect, useImperativeHandle, forwardRef } from 'react'

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
}

export const EnvEditForm = forwardRef((props: FromProps, ref) => {
  const { defaultEnv, closeModal, onSubmit, isTable } = props

  const { zones, defaultZone } = useModuleState(PropertyModule, {
    selector: (state) => ({
      zones: state.zones.map((zone) => ({ key: zone, text: zone })),
      defaultZone: state.defaultZone,
    }),
    dependencies: [],
  })

  const headersRef = useRef<{ setHeaders: (v: HeaderSchema[]) => void; getHeaders: () => HeaderSchema[] }>()
  const cookiesRef = useRef<{ setCookies: (v: CookieSchema[]) => void; getCookies: () => CookieSchema[] }>()
  const localStorageRef = useRef<{
    setLocalStorage: (v: LocalStorageSchema[]) => void
    getLocalStorage: () => LocalStorageSchema[]
  }>()
  const sessionStorageRef = useRef<{
    setSessionStorage: (v: SessionStorageSchema[]) => void
    getSessionStorage: () => SessionStorageSchema[]
  }>()
  const loginScriptRef = useRef<{
    setScript: (v: string | null) => void
    getScript: () => string | null
  }>()

  const [tableEnvName, setTableEnvName] = useState<string | undefined>(defaultEnv?.name)
  const [jsonEnv, setJsonEnv] = useState<string | undefined>(JSON.stringify(defaultEnv))
  const [zone, setZone] = useState(defaultEnv?.zone ?? defaultZone)
  const [errorMessage, setErrorMessage] = useState<string>()

  const getJsonPayload = useCallback(() => {
    if (!jsonEnv) {
      return
    }

    try {
      return JSON.parse(jsonEnv) as Partial<EnvSchema>
    } catch (error) {
      setErrorMessage('invalid json')
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
  }, [zone, tableEnvName])

  useEffect(() => {
    if (!isTable) {
      setJsonEnv(JSON.stringify(defaultEnv))
    } else {
      cookiesRef.current?.setCookies(defaultEnv?.cookies ?? [])
      headersRef.current?.setHeaders(defaultEnv?.headers ?? [])
      localStorageRef.current?.setLocalStorage(defaultEnv?.localStorage ?? [])
      sessionStorageRef.current?.setSessionStorage(defaultEnv?.sessionStorage ?? [])
      setTableEnvName(defaultEnv?.name)
    }
    defaultEnv?.zone && setZone(defaultEnv?.zone)
  }, [defaultEnv, isTable])

  useImperativeHandle(
    ref,
    () => ({
      getTablePayload,
      getJsonPayload,
    }),
    [getJsonPayload, getTablePayload],
  )

  const onSave = useCallback(
    (_e: any) => {
      const payload = isTable ? getTablePayload() : getJsonPayload()

      if (!payload) {
        return
      }

      // Not allowed to save
      if (!payload.name || payload.loginScript === '') {
        return
      }

      const needReminder = payload?.cookies?.some((c) => !!c.expire)

      onSubmit({
        id: defaultEnv?.id,
        needReminder,
        zone,
        ...payload,
      })
    },
    [defaultEnv?.id, zone, getJsonPayload, getTablePayload, onSubmit, isTable],
  )

  const onCopy = useCallback(() => {
    const payload = getJsonPayload()
    navigator.clipboard
      .writeText(JSON.stringify({ ...payload, id: undefined })) // do not copy id
      .then(() => {
        notify.success({ content: 'Copied', duration: 3000 })
      })
      .catch(() => {
        notify.error({ content: 'Copy failed, please copy it manually.' })
      })
  }, [getJsonPayload])

  const onZoneChange = useCallback((_: any, option?: IDropdownOption) => {
    if (!option) {
      return
    }

    setZone(option.key as string)
  }, [])

  const onJsonChange = useCallback((_: any, value?: string) => {
    setJsonEnv(value)
  }, [])

  const onNameChange = useCallback((_: any, value?: string) => {
    setTableEnvName(value)
  }, [])

  const innerTable = (
    <div style={!isTable ? { display: 'none' } : undefined}>
      <RequiredTextField id="name" label="Environment name" value={tableEnvName} onChange={onNameChange} />
      <FormHeaders defaultHeaders={defaultEnv?.headers ?? []} ref={headersRef} />
      <FormCookies defaultCookies={defaultEnv?.cookies ?? []} ref={cookiesRef} />
      <FormLocalStorage defaultLocalStorage={defaultEnv?.localStorage ?? []} ref={localStorageRef} />
      <FormSessionStorage defaultSessionStorage={defaultEnv?.sessionStorage ?? []} ref={sessionStorageRef} />
      <ComboBox label="Zone" selectedKey={zone} options={zones} onChange={onZoneChange} useComboBoxAsMenuWidth />
      <LoginScriptForm defaultScript={defaultEnv?.loginScript} ref={loginScriptRef} />
    </div>
  )

  const innerJson = (
    <div style={isTable ? { display: 'none' } : undefined}>
      <TextField
        errorMessage={errorMessage}
        onChange={onJsonChange}
        value={jsonEnv}
        placeholder='{"name": "name", "headers": []}'
        multiline={true}
        styles={{ field: { height: '200px' } }}
      />
    </div>
  )

  return (
    <Stack tokens={{ childrenGap: 8 }}>
      {innerTable}
      {innerJson}
      <Stack tokens={{ childrenGap: 8 }} horizontal horizontalAlign="space-between" verticalAlign="end">
        <DialogFooter>
          <TooltipHost content="Export the environment configuration as JSON format">
            <IconButton iconProps={{ iconName: 'ExportOutlined' }} onClick={onCopy} />
          </TooltipHost>
          <PrimaryButton onClick={onSave} text="Save" />
          <DefaultButton onClick={closeModal} text="Cancel" />
        </DialogFooter>
      </Stack>
    </Stack>
  )
})
