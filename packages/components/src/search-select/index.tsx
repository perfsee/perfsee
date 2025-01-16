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

import { CloseOutlined } from '@ant-design/icons'
import { useTheme, css } from '@emotion/react'
import {
  Callout,
  Label,
  DirectionalHint,
  ProgressIndicator,
  TextField,
  IIconProps,
  NeutralColors,
  Stack,
} from '@fluentui/react'
import { uniqBy } from 'lodash'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useToggleState } from '../common'

import { SearchSelectOption } from './option'
import { ErrorMessage, TargetWrapper, Tag } from './style'

export interface SearchSelectOption<T = string> {
  key: T
  text: string
}

export type SelectedKey = string | number

interface SearchSelectProps<T1 extends boolean, T2 extends SelectedKey> {
  multiSelect?: T1
  value?: T2
  values?: T2[]
  placeholder?: string
  label?: string
  required?: boolean
  title?: string
  iconProps?: IIconProps
  allowFreeform?: T1 extends true ? never : boolean
  onChange: (value: T1 extends true ? T2[] : T2) => void
  options: SearchSelectOption<T2>[]
  selectOptions?: SearchSelectOption<T2>[]
  onKeywordChange?: (keyword: string) => void
  dropdownLoading?: boolean
  errorMessage?: string
  calloutMaxHeight?: number
  multiSelectMaxVisible?: number
}

export const SearchSelect = <T1 extends boolean = false, T2 extends SelectedKey = number>({
  value,
  values,
  onChange,
  multiSelect,
  options,
  selectOptions,
  placeholder,
  title,
  label,
  allowFreeform,
  iconProps,
  required,
  onKeywordChange,
  dropdownLoading,
  errorMessage,
  calloutMaxHeight,
  multiSelectMaxVisible = 3,
}: SearchSelectProps<T1, T2>) => {
  const theme = useTheme()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [dropdownVisible, openDropdown, closeDropdown] = useToggleState(false)
  const [wrapperWidth, setWrapperWidth] = useState(0)
  const [showText, setShowText] = useState<string>('')
  const [searchText, setSearchText] = useState<string>('')
  const [_values, setValues] = useState<SelectedKey[]>(values ?? [])

  const handleOnChange = useCallback(
    (option: { key: string; text: string; selected: boolean }) => {
      if (option) {
        const { key, selected, text } = option
        if (multiSelect) {
          if (selected) {
            setValues([..._values, option.key])
          } else {
            setValues(_values.filter((value) => value !== key))
          }
        } else {
          closeDropdown()
          setShowText(text)
          ;(onChange as (value: string) => void)(option.key)
        }
        setSearchText('')
      }
    },
    [multiSelect, _values, closeDropdown, onChange],
  )

  const handleKeywordChange = useCallback(
    (_: any, value?: string) => {
      if (value !== undefined) {
        openDropdown()
        onKeywordChange?.(value)
        setShowText(value)
        setSearchText(value)
      }
    },
    [onKeywordChange, openDropdown],
  )

  const renderOptions = useMemo(
    () =>
      uniqBy([...options, ...(selectOptions ?? [])], 'key')
        .filter((option) => option.text.includes(searchText))
        .map((option) => {
          return (
            <SearchSelectOption
              checked={!!_values.find((value) => value === option.key)}
              key={option.key}
              id={option.key as string}
              text={option.text}
              multiSelect={!!multiSelect}
              onChange={handleOnChange}
            />
          )
        }),
    [handleOnChange, multiSelect, options, selectOptions, _values, searchText],
  )

  const handleCloseDropdown = useCallback(() => {
    closeDropdown()
    if (multiSelect) {
      ;(onChange as (value: SelectedKey[]) => void)(_values)
      setSearchText('')
    } else {
      const dropdown = selectOptions?.find(({ key }) => key === value)
      dropdown && setShowText(dropdown.text)
    }
  }, [_values, closeDropdown, multiSelect, onChange, selectOptions, value])

  const handleOnBlur = useCallback(() => {
    if (allowFreeform) {
      ;(onChange as (value: string) => void)(showText)
      setSearchText('')
    }
  }, [allowFreeform, onChange, showText])

  const handleOnKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      inputRef.current?.blur()
    }
  }, [])

  useEffect(() => {
    if (wrapperRef.current) {
      setWrapperWidth(wrapperRef.current.clientWidth)
    }
  }, [setWrapperWidth])

  useEffect(() => {
    if (!multiSelect) {
      const dropdown = selectOptions?.find(({ key }) => key === value)
      if (dropdown) {
        setShowText(dropdown.text)
      } else if (allowFreeform) {
        setShowText(value?.toString() ?? '')
      }
    }
  }, [allowFreeform, multiSelect, selectOptions, value])

  const removeItem = useCallback(
    (key: SelectedKey) => {
      return (e: React.MouseEvent<HTMLSpanElement>) => {
        const selected = _values.filter((k) => k !== key)
        setValues(selected)
        ;(onChange as (value: SelectedKey[]) => void)(selected)
        setSearchText('')
        e.stopPropagation()
      }
    },
    [_values, onChange],
  )

  const textFieldCommonProps = {
    placeholder,
    value: showText,
    onChange: handleKeywordChange,
    onClick: openDropdown,
    ref: inputRef,
    iconProps: iconProps,
    onBlur: handleOnBlur,
    onKeyDown: handleOnKeyDown,
    autoComplete: 'off',
  }

  const onRenderInput = useCallback(
    (props: any, defaultRenderer?: (props?: any) => JSX.Element | null) => {
      return (
        <Stack horizontal tokens={{ childrenGap: 4 }} styles={{ root: { flexWrap: 'no-wrap' } }} verticalAlign="center">
          {_values.length > multiSelectMaxVisible ? <span style={{ marginLeft: 4 }}>...</span> : null}
          {_values?.slice(-multiSelectMaxVisible).map((v) => (
            <Tag css={css({ margin: '2px 0', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis' })} key={v}>
              {v}
              <CloseOutlined onClick={removeItem(v)} />
            </Tag>
          ))}
          <Stack>{defaultRenderer?.(props)}</Stack>
        </Stack>
      )
    },
    [_values, removeItem, multiSelectMaxVisible],
  )

  const searchBox = multiSelect ? (
    <>
      <TargetWrapper error={!!errorMessage} ref={wrapperRef}>
        <TextField
          styles={{
            root: { flex: 1, minWidth: '200px', height: '30px', border: 'none', outline: 'none', overflow: 'hidden' },
            fieldGroup: { border: 'none', outline: 'none', ':after': { display: 'none' } },
            prefix: {
              background: 'transparent',
              borderRight: `1px solid ${NeutralColors.gray110}`,
              color: theme.text.color,
            },
          }}
          {...textFieldCommonProps}
          onRenderInput={onRenderInput}
          prefix={title}
        />
      </TargetWrapper>
      <ErrorMessage>{errorMessage}</ErrorMessage>
    </>
  ) : (
    <div ref={wrapperRef}>
      <TextField
        styles={{
          root: { minWidth: 200 },
          prefix: {
            background: 'transparent',
            borderRight: `1px solid ${NeutralColors.gray110}`,
            color: theme.text.color,
          },
        }}
        {...textFieldCommonProps}
        errorMessage={errorMessage}
        prefix={title}
      />
    </div>
  )

  return (
    <div>
      {label && <Label required={required}>{label}</Label>}
      {searchBox}
      {dropdownVisible && (
        <Callout
          calloutWidth={wrapperWidth}
          calloutMaxHeight={calloutMaxHeight}
          isBeakVisible={false}
          target={wrapperRef}
          doNotLayer={false}
          gapSpace={2}
          onDismiss={handleCloseDropdown}
          directionalHint={DirectionalHint.bottomCenter}
          directionalHintFixed
        >
          {dropdownLoading && (
            <ProgressIndicator
              styles={{ root: { width: '100%', position: 'absolute' }, itemProgress: { padding: 0 } }}
            />
          )}
          {renderOptions}
        </Callout>
      )}
    </div>
  )
}
