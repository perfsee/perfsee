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
  IconButton,
  Stack,
  DefaultButton,
  Label,
  Checkbox,
  IIconProps,
  DatePicker,
  ComboBox,
  IComboBoxOption,
  TextField,
  Toggle,
} from '@fluentui/react'
import dayjs from 'dayjs'
import { capitalize, pick } from 'lodash'
import { FormEvent, forwardRef, useMemo, useState, useCallback, useImperativeHandle } from 'react'

import { RequiredTextField, TooltipWithEllipsis, useToggleState } from '@perfsee/components'
import { lighten, SharedColors } from '@perfsee/dls'
import { CookieSchema } from '@perfsee/platform/modules/shared'

import { NormalToken, TextFieldStyles } from '../style'

export type PartialCookie = Partial<CookieSchema>

type CookieProps = {
  cookie: PartialCookie
  index: number
  onCookieChange: (value: PartialCookie, index: number) => void
  onCookieRemove: (index: number) => void
}

const removeIconProps: IIconProps = { iconName: 'delete' }
const editIconProps: IIconProps = { iconName: 'edit' }
const saveIconProps: IIconProps = { iconName: 'save' }

const CheckboxStyles = {
  root: {
    backgroundColor: lighten(SharedColors.blue10, 0.5),
    border: `1px solid ${SharedColors.blue10}`,
    padding: '4px',
    margin: '8px 0',
  },
}

const SameSiteOptions = [
  {
    key: 'None',
    text: 'None',
  },
  {
    key: 'Strict',
    text: 'Strict',
  },
  {
    key: 'Lax',
    text: 'Lax',
  },
]

const FormCookie = (props: CookieProps) => {
  const [editing, open, close] = useToggleState(!props.cookie.value)

  const { cookie, index, onCookieRemove, onCookieChange } = props

  const onRemove = useCallback(() => {
    onCookieRemove(index)
  }, [index, onCookieRemove])

  const onSelectDate = useCallback(
    (date?: Date | null) => {
      if (date) {
        onCookieChange({ ...cookie, expire: date.toISOString() }, index)
      }
    },
    [cookie, index, onCookieChange],
  )

  const onRemoveDate = useCallback(() => {
    onCookieChange({ ...cookie, expire: undefined }, index)
  }, [cookie, index, onCookieChange])

  const onChange = useCallback(
    (e?: FormEvent<HTMLElement | HTMLInputElement>, value?: string | boolean) => {
      if (!e || value === undefined) {
        return
      }
      const type = (e.target as HTMLInputElement).dataset.type!
      onCookieChange(
        {
          ...cookie,
          [type]: typeof value === 'string' ? value.trim() : value,
        },
        index,
      )
    },
    [cookie, index, onCookieChange],
  )

  const onSameSiteChange = useCallback(
    (_e?: any, _o?: IComboBoxOption, _i?: number, value?: string) => {
      onCookieChange(
        {
          ...cookie,
          sameSite: value as 'Strict' | 'Lax' | 'None',
        },
        index,
      )
    },
    [cookie, index, onCookieChange],
  )

  const header = (
    <Stack horizontal verticalAlign="center" horizontalAlign="space-between" tokens={{ padding: '8px 0 0 0' }}>
      Cookie #{index + 1}
      <div>
        <IconButton
          disabled={editing ? !cookie.name || !cookie.value : false}
          iconProps={!editing ? editIconProps : saveIconProps}
          onClick={!editing ? open : close}
        />
        <IconButton
          iconProps={removeIconProps}
          styles={{ root: { color: SharedColors.red10 }, rootHovered: { color: SharedColors.red10 } }}
          onClick={onRemove}
        />
      </div>
    </Stack>
  )

  if (!editing) {
    return (
      <div>
        {header}
        <Stack styles={{ root: { '> div': { width: '50%' } } }} horizontal>
          <TooltipWithEllipsis content={cookie.name ?? ''}>
            <b>Name: </b>
            {cookie.name}
          </TooltipWithEllipsis>
          <TooltipWithEllipsis content={cookie.value ?? ''}>
            <b>Value: </b>
            {cookie.value}
          </TooltipWithEllipsis>
        </Stack>
        <Stack styles={{ root: { '> div': { width: '50%' } } }} horizontal>
          {!!cookie.domain && (
            <TooltipWithEllipsis content={cookie.domain}>
              <b>Domain: </b> {cookie.domain}
            </TooltipWithEllipsis>
          )}
          {!!cookie.path && (
            <TooltipWithEllipsis content={cookie.path}>
              <b>Path: </b> {cookie.path}
            </TooltipWithEllipsis>
          )}
        </Stack>
        <Stack styles={{ root: { '> div': { width: '50%' } } }} horizontal>
          <div>
            <b>HttpOnly: </b>
            {cookie.httpOnly ? 'Yes' : 'No'}
          </div>
          <div>
            <b>Secure: </b>
            {cookie.secure ? 'Yes' : 'No'}
          </div>
        </Stack>
        <Stack styles={{ root: { '> div': { width: '50%' } } }} horizontal>
          <div>
            <b>SameSite: </b>
            {cookie.sameSite ?? 'Lax'}
          </div>
          {cookie.expire && (
            <div>
              <b>Expired: </b>
              {dayjs(cookie.expire).format('YYYY-MM-DD')}
            </div>
          )}
        </Stack>
      </div>
    )
  }

  return (
    <div>
      {header}
      <Stack horizontal tokens={NormalToken}>
        <RequiredTextField
          defaultValue={cookie.name}
          styles={TextFieldStyles}
          placeholder="Name"
          onChange={onChange}
          data-type="name"
        />
        <RequiredTextField
          data-type="value"
          defaultValue={cookie.value}
          styles={TextFieldStyles}
          placeholder="Value"
          onChange={onChange}
        />
      </Stack>
      <Stack horizontal tokens={NormalToken}>
        <TextField
          defaultValue={cookie.domain ?? undefined}
          onChange={onChange}
          styles={TextFieldStyles}
          placeholder="Domain"
          data-type="domain"
        />
        <TextField
          defaultValue={cookie.path ?? undefined}
          onChange={onChange}
          styles={TextFieldStyles}
          placeholder="Path: e.g / "
          data-type="path"
        />
      </Stack>
      <Checkbox
        styles={CheckboxStyles}
        inputProps={{ 'data-type': 'httpOnly' } as any}
        onChange={onChange}
        label="Don't share with `document.cookie` (HttpOnly)"
        defaultChecked={cookie.httpOnly}
      />
      <Checkbox
        styles={CheckboxStyles}
        inputProps={{ 'data-type': 'secure' } as any}
        onChange={onChange}
        label="Share only with SSL servers (Secure)"
        defaultChecked={cookie.secure}
      />
      <Stack horizontal verticalAlign="center">
        <Stack.Item basis="50%" grow={0} shrink={0}>
          <Stack horizontal verticalAlign="center" tokens={NormalToken}>
            <span>Same Site:</span>
            <ComboBox
              selectedKey={cookie.sameSite ?? 'Lax'}
              placeholder="Same Site"
              onChange={onSameSiteChange}
              styles={{ root: { flex: 1 }, textField: { '> span': { display: 'none' } } }}
              useComboBoxAsMenuWidth={true}
              allowFreeform={false}
              options={SameSiteOptions}
            />
          </Stack>
        </Stack.Item>
        <Stack.Item basis="50%" grow={0} shrink={0}>
          <Stack horizontal verticalAlign="center" tokens={NormalToken}>
            <span>Expire time:</span>
            <DatePicker
              styles={{ root: { flex: 1 }, textField: { '> span': { display: 'none' } } }}
              value={cookie.expire ? new Date(cookie.expire) : undefined}
              showMonthPickerAsOverlay={true}
              placeholder="We will notify you on this date."
              minDate={new Date()}
              onSelectDate={onSelectDate}
            />
            <IconButton
              iconProps={removeIconProps}
              styles={{ root: { color: SharedColors.gray30 } }}
              onClick={onRemoveDate}
            />
          </Stack>
        </Stack.Item>
      </Stack>
    </div>
  )
}

const defaultCookie = { httpOnly: true, secure: false, sameSite: 'Lax' }

export const FormCookies = forwardRef((props: { defaultCookies: CookieSchema[] }, ref) => {
  const [cookies, setCookies] = useState<PartialCookie[]>(props.defaultCookies)
  const [isTable, toggle] = useState<boolean>(true)
  const [errorInfo, setErrorInfo] = useState<string>()

  useImperativeHandle(
    ref,
    () => ({
      getCookies: () => {
        return cookies.filter((c) => c.name && c.value) // before updating env
      },
    }),
    [cookies],
  )

  const onCookieRemove = useCallback(
    (index: number) => {
      const newCookies = cookies.filter((_, i) => i !== index)
      setCookies(newCookies)
    },
    [cookies],
  )

  const onCookieChange = useCallback(
    (value: PartialCookie, index: number) => {
      const newCookies = [...cookies]
      newCookies[index] = value
      setCookies(newCookies)
    },
    [cookies],
  )

  const onAddCookie = useCallback(() => {
    setCookies([...cookies, defaultCookie])
  }, [cookies])

  const onToggle = useCallback(() => {
    toggle((checked) => !checked)
  }, [toggle])

  const cookieString = useMemo(() => {
    return cookies.length ? JSON.stringify(cookies) : undefined
  }, [cookies])

  const onCookiesChange = useCallback((_e: any, value?: string) => {
    if (!value) {
      setCookies([])
      return
    }

    try {
      const newCookies = (JSON.parse(value) as CookieSchema[]).map((c) => {
        const sameSite = capitalize(c.sameSite)
        return {
          ...defaultCookie,
          ...pick(c, 'name', 'value', 'domain', 'path', 'httpOnly', 'secure'),
          sameSite: sameSite === 'Lax' || sameSite === 'Strict' ? sameSite : 'None',
        }
      })

      if (newCookies.some((c) => !c.name || !c.value)) {
        setErrorInfo('Lack of name or value')
        return
      }

      setCookies(newCookies)
      setErrorInfo(undefined)
    } catch (e) {
      setErrorInfo('Invalid JSON formatting')
    }
  }, [])

  const formCookies = useMemo(() => {
    return cookies.map((_, i) => {
      return (
        <FormCookie
          onCookieChange={onCookieChange}
          onCookieRemove={onCookieRemove}
          cookie={cookies[i]}
          index={i}
          key={i}
        />
      )
    })
  }, [cookies, onCookieChange, onCookieRemove])

  return (
    <>
      <Stack horizontal horizontalAlign="space-between" tokens={{ padding: '8px 0 0 0' }}>
        <Label htmlFor="cookies">Cookies</Label>
        <Stack horizontal verticalAlign="center">
          <Toggle
            defaultChecked={isTable}
            styles={{ root: { marginBottom: 0 } }}
            onText="Table"
            offText="Stringify"
            onClick={onToggle}
          />
          {isTable && <DefaultButton onClick={onAddCookie}>add Cookies</DefaultButton>}
        </Stack>
      </Stack>
      {isTable ? (
        formCookies
      ) : (
        <TextField
          defaultValue={cookieString}
          onChange={onCookiesChange}
          multiline={true}
          errorMessage={errorInfo}
          placeholder={`[{"name": "a", "value": "b", "domain": "localhost", "path": "/" }]`}
        />
      )}
    </>
  )
})
