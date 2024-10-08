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

import { DefaultButton, Label, Stack, IconButton, SharedColors, TextField, Toggle } from '@fluentui/react'
import { FormEvent, forwardRef, useCallback, useImperativeHandle, useMemo, useState, memo } from 'react'

import { SessionStorageType } from '@perfsee/shared'

import { NormalToken } from '../style'

type FormStorageProps = {
  index: number
  item: SessionStorageType
  onStorageRemove: (index: number) => void
  onStorageChange: (item: SessionStorageType, index: number) => void
}

const FormStorage = memo((props: FormStorageProps) => {
  const { index, item, onStorageRemove, onStorageChange } = props

  const onRemove = useCallback(() => {
    onStorageRemove(index)
  }, [index, onStorageRemove])

  const onChange = useCallback(
    (e?: FormEvent<HTMLElement | HTMLInputElement>, value?: string) => {
      if (!e || value === undefined) {
        return
      }
      const type = (e.target as HTMLInputElement).dataset.type!
      onStorageChange({ ...item, [type]: value }, index)
    },
    [index, item, onStorageChange],
  )

  const inputValidate = useCallback((value: string) => {
    if (!value) {
      return 'Required'
    }

    if (value.length > 1024) {
      return 'length exceed 1024 bytes'
    }
  }, [])

  return (
    <div>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" tokens={{ padding: '8px 0 0 0' }}>
        SessionStorage #{index + 1}
        <IconButton
          iconProps={{ iconName: 'delete' }}
          styles={{ root: { color: SharedColors.red10 }, rootHovered: { color: SharedColors.red10 } }}
          onClick={onRemove}
        />
      </Stack>
      <Stack horizontal tokens={NormalToken}>
        <TextField
          value={item.key}
          data-type="key"
          onChange={onChange}
          styles={{ root: { flexGrow: 2 } }}
          placeholder="Key"
          onGetErrorMessage={inputValidate}
        />
        <TextField
          data-type="value"
          onChange={onChange}
          value={item.value}
          styles={{ root: { flexGrow: 2 } }}
          placeholder="Value"
          onGetErrorMessage={inputValidate}
        />
      </Stack>
    </div>
  )
})

type Props = { defaultSessionStorage: SessionStorageType[] }

export const FormSessionStorage = forwardRef((props: Props, ref) => {
  const [storages, setStorages] = useState<SessionStorageType[]>(props.defaultSessionStorage)
  const [isTable, toggle] = useState<boolean>(true)
  const [errorInfo, setErrorInfo] = useState<string>()

  useImperativeHandle(
    ref,
    () => ({
      getSessionStorage: () => storages,
    }),
    [storages],
  )

  const onStorageChange = useCallback(
    (storage: SessionStorageType, index: number) => {
      const newStorages = [...storages]
      newStorages[index] = storage
      setStorages(newStorages)
    },
    [storages],
  )

  const onStorageRemove = useCallback((index: number) => {
    setStorages((storages) => {
      return storages.filter((_, i) => i !== index)
    })
  }, [])

  const onAddStorage = useCallback(() => {
    setStorages([...storages, { key: '', value: '' }])
  }, [storages])

  const storageTable = useMemo(() => {
    return storages.map((item, i) => {
      return (
        <FormStorage
          key={i}
          index={i}
          item={item}
          onStorageChange={onStorageChange}
          onStorageRemove={onStorageRemove}
        />
      )
    })
  }, [onStorageChange, onStorageRemove, storages])

  const onToggle = useCallback(() => {
    toggle((checked) => !checked)
  }, [toggle])

  const storageString = useMemo(() => {
    return storages.length
      ? `{${storages
          .filter((h) => h.key && h.value)
          .map((h) => {
            if (typeof h.value === 'object') {
              return `"${h.key}":"${JSON.stringify(h.value)}"`
            }
            return `"${h.key}":"${h.value!.replaceAll('"', '\\"')}"`
          })
          .join(',')}}`
      : ''
  }, [storages])

  const onStorageStringChange = useCallback((_: any, str?: string) => {
    if (!str) {
      setStorages([])
      return
    }

    try {
      const newStorages: SessionStorageType[] = []
      Object.entries<string>(JSON.parse(str)).forEach(([key, value]) => {
        if (key && value) {
          if (typeof value === 'object') {
            newStorages.push({ key, value: JSON.stringify(value) })
          } else {
            newStorages.push({ key, value })
          }
        }
      })
      setStorages(newStorages)
      setErrorInfo(undefined)
    } catch (e) {
      setErrorInfo('Invalid JSON formatting')
    }
  }, [])

  return (
    <>
      <Stack horizontal horizontalAlign="space-between" tokens={{ padding: '8px 0 0 0' }}>
        <Label htmlFor="sessionStorage">Session Storage</Label>
        <Stack horizontal verticalAlign="center">
          <Toggle
            defaultChecked={isTable}
            styles={{ root: { marginBottom: 0 } }}
            onText="Table"
            offText="Stringify"
            onClick={onToggle}
          />
          {isTable && <DefaultButton onClick={onAddStorage}>add local storage</DefaultButton>}
        </Stack>
      </Stack>
      {isTable ? (
        storageTable
      ) : (
        <TextField
          defaultValue={storageString}
          onChange={onStorageStringChange}
          multiline={true}
          errorMessage={errorInfo}
          placeholder={`{"key":"value"}`}
        />
      )}
    </>
  )
})
