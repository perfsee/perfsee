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
  IComboBoxOption,
  ComboBox,
  DefaultButton,
  Label,
  Stack,
  IconButton,
  SharedColors,
  Toggle,
  TextField,
} from '@fluentui/react'
import { FormEvent, forwardRef, useCallback, useImperativeHandle, useMemo, useState, memo } from 'react'

import { RequiredTextField } from '@perfsee/components'
import { HeaderHostType, HeaderType } from '@perfsee/shared'

import { NormalToken } from '../style'

const defaultHostOptions = [
  {
    key: HeaderHostType.All,
    text: 'Apply to all request',
  },
  {
    key: HeaderHostType.Self,
    text: 'Apply to page load',
  },
]

type FormHeaderProps = {
  index: number
  header: Partial<HeaderType>
  onHeaderRemove: (index: number) => void
  onHeaderChange: (header: Partial<HeaderType>, index: number) => void
}

const FormHeader = memo((props: FormHeaderProps) => {
  const { index, header, onHeaderRemove, onHeaderChange } = props

  const onRemove = useCallback(() => {
    onHeaderRemove(index)
  }, [index, onHeaderRemove])

  const onHostChange = useCallback(
    (_e?: any, option?: IComboBoxOption, _i?: number, value?: string) => {
      onHeaderChange({ ...header, host: (option?.key as HeaderHostType) ?? value }, index)
    },
    [header, index, onHeaderChange],
  )

  const onChange = useCallback(
    (e?: FormEvent<HTMLElement | HTMLInputElement>, value?: string) => {
      if (!e || value === undefined) {
        return
      }
      const type = (e.target as HTMLInputElement).dataset.type!
      onHeaderChange({ ...header, [type]: value }, index)
    },
    [header, index, onHeaderChange],
  )

  const headerHostOptions = useMemo(() => {
    return header.host && header.host !== HeaderHostType.All && header.host !== HeaderHostType.Self
      ? [...defaultHostOptions, { key: header.host, text: header.host }]
      : defaultHostOptions
  }, [header.host])

  return (
    <div>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center" tokens={{ padding: '8px 0 0 0' }}>
        Header #{index + 1}
        <IconButton
          iconProps={{ iconName: 'delete' }}
          styles={{ root: { color: SharedColors.red10 }, rootHovered: { color: SharedColors.red10 } }}
          onClick={onRemove}
        />
      </Stack>
      <Stack horizontal tokens={NormalToken}>
        <RequiredTextField
          value={header.key}
          data-type="key"
          onChange={onChange}
          styles={{ root: { flexGrow: 2 } }}
          placeholder="Key"
        />
        <RequiredTextField
          data-type="value"
          onChange={onChange}
          value={header.value}
          styles={{ root: { flexGrow: 2 } }}
          placeholder="Value"
        />
        <ComboBox
          selectedKey={header.host}
          placeholder="Domain or select"
          onChange={onHostChange}
          useComboBoxAsMenuWidth={true}
          styles={{ container: { flexGrow: 3 } }}
          allowFreeform={true}
          options={headerHostOptions}
        />
      </Stack>
    </div>
  )
})

type Props = { defaultHeaders: HeaderType[] }

export const FormHeaders = forwardRef((props: Props, ref) => {
  const [headers, setHeaders] = useState<Partial<HeaderType>[]>(props.defaultHeaders)
  const [isTable, toggle] = useState<boolean>(true)
  const [errorInfo, setErrorInfo] = useState<string>()

  useImperativeHandle(
    ref,
    () => ({
      setHeaders: (hs: HeaderType[]) => setHeaders(hs),
      getHeaders: () =>
        headers
          .map((h) => (h.host ? h : { ...h, host: HeaderHostType.Self }))
          .filter((h) => h.key && typeof h.value !== 'undefined'),
    }),
    [headers],
  )

  const onHeaderChange = useCallback(
    (header: Partial<HeaderType>, index: number) => {
      const newHeaders = [...headers]
      newHeaders[index] = header
      setHeaders(newHeaders)
    },
    [headers],
  )

  const onHeaderRemove = useCallback(
    (index: number) => {
      const newHeaders = headers.filter((_, i) => i !== index)
      setHeaders(newHeaders)
    },
    [headers],
  )

  const onAddHeader = useCallback(() => {
    setHeaders([...headers, {}])
  }, [headers])

  const onToggle = useCallback(() => {
    toggle((checked) => !checked)
  }, [toggle])

  const onHeadersChange = useCallback(
    (_: any, headerString?: string) => {
      if (!headerString) {
        setHeaders([])
        return
      }

      try {
        const map = new Map(headers.map((h) => [h.key, h]))
        const newHeaders: HeaderType[] = []
        Object.entries<string>(JSON.parse(headerString)).forEach(([key, value]) => {
          if (key && value) {
            const header = map.get(key)
            newHeaders.push({ host: HeaderHostType.Self, ...header, key, value })
          }
        })
        setHeaders(newHeaders)
        setErrorInfo(undefined)
      } catch (e) {
        setErrorInfo('Invalid JSON formatting')
      }
    },
    [headers],
  )

  const headerString = useMemo(() => {
    return headers.length
      ? `{${headers
          .filter((h) => h.key && h.value)
          .map((h) => `"${h.key}":"${h.value!.replaceAll('"', '\\"')}"`)
          .join(',')}}`
      : ''
  }, [headers])

  const formHeaders = useMemo(() => {
    return headers.map((_, i) => {
      const header = headers[i]
      return (
        <FormHeader header={header} index={i} key={i} onHeaderChange={onHeaderChange} onHeaderRemove={onHeaderRemove} />
      )
    })
  }, [headers, onHeaderChange, onHeaderRemove])

  return (
    <>
      <Stack horizontal horizontalAlign="space-between" tokens={{ padding: '8px 0 0 0' }}>
        <Label htmlFor="headers">Headers</Label>
        <Stack horizontal verticalAlign="center">
          <Toggle
            defaultChecked={isTable}
            styles={{ root: { marginBottom: 0 } }}
            onText="Table"
            offText="Json"
            onClick={onToggle}
          />
          {isTable && <DefaultButton onClick={onAddHeader}>add header</DefaultButton>}
        </Stack>
      </Stack>
      {isTable ? (
        formHeaders
      ) : (
        <TextField
          defaultValue={headerString}
          onChange={onHeadersChange}
          multiline={true}
          errorMessage={errorInfo}
          placeholder={`{"x-header":"a","x-other-header":"b"}`}
        />
      )}
    </>
  )
})
