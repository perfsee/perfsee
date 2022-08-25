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

import { Dropdown, IDropdownOption } from '@fluentui/react'
import { FormEvent, useCallback, useMemo } from 'react'

import { LabelWithTips } from '../label-with-tips'

interface Props<T> {
  options: { id: T; name: string }[]
  defaultIds?: T[]
  ids: T[]
  onSelectChange?: (ids: T[]) => void
  onChange?: (e: FormEvent<HTMLDivElement>, option?: IDropdownOption<T>, index?: number) => void
  errorMessage?: string
  multiSelect?: boolean
  label?: string
  required?: boolean
  tips?: string
  // IDropdownProps
  placeholder?: string
}

export const MultiSelector = <T,>(props: Props<T>) => {
  const {
    options,
    defaultIds,
    ids,
    onSelectChange,
    errorMessage,
    multiSelect = true,
    required = true,
    label,
    tips,
    onChange,
    ...otherProps
  } = props

  const onDropdownChange = useCallback(
    (e: FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number) => {
      if (typeof onChange === 'function') {
        onChange(e, option, index)
      } else if (typeof onSelectChange === 'function') {
        if (!option?.key) {
          return false
        }

        const changeId = option.key as any as T
        let newIds = [changeId]

        if (multiSelect) {
          newIds = option.selected ? [...ids, changeId] : ids.filter((id) => id !== changeId)
        }

        onSelectChange(newIds)
      }
    },
    [onChange, onSelectChange, multiSelect, ids],
  )

  const onRenderLabel = useCallback(
    (_p?: any) => {
      if (!label) {
        return null
      }
      return <LabelWithTips tips={tips} label={label ?? ''} required={required} />
    },
    [required, label, tips],
  )

  const dropdownOptions = useMemo(() => {
    return options.map((v) => {
      return { key: v.id as any, text: v.name }
    })
  }, [options])

  return (
    <Dropdown
      styles={{
        callout: { marginTop: '4px' },
        root: { minWidth: '300px' },
      }}
      multiSelect={multiSelect}
      selectedKey={multiSelect ? undefined : (ids[0] as any)}
      selectedKeys={multiSelect ? (ids as any[]) : undefined}
      options={dropdownOptions}
      onChange={onDropdownChange}
      onRenderLabel={onRenderLabel}
      {...otherProps}
      errorMessage={!defaultIds?.length && !ids.length ? errorMessage : undefined}
    />
  )
}
