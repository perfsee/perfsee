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

import { IDropdownProps, Dropdown, IDropdownOption, NeutralColors } from '@fluentui/react'
import { useCallback } from 'react'

import { SelectKeySpan } from './style'

interface Props<T> extends IDropdownProps {
  onKeyChange?: (key: T) => void
}

export function Select<T = string>(props: Props<T>) {
  const { title, placeholder, onKeyChange, onRenderTitle, onChange, ...restProps } = props

  const onRenderDropdownTitle = useCallback(
    (options?: IDropdownOption[]) => {
      if (!options) {
        return null
      }

      const optionsDisplay = options.map(({ text }) => text).join(', ')
      return (
        <>
          {title ? <SelectKeySpan>{title}</SelectKeySpan> : undefined}
          {onRenderTitle ? onRenderTitle(options, () => <>{optionsDisplay}</>) : optionsDisplay}
        </>
      )
    },
    [onRenderTitle, title],
  )

  const onRenderPlaceholder = useCallback(() => {
    return (
      <>
        <SelectKeySpan>{title}</SelectKeySpan>
        {placeholder}
      </>
    )
  }, [placeholder, title])

  const onDropdownChange = useCallback(
    (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption, index?: number) => {
      if (onChange) {
        onChange(event, option, index)
      }
      if (option?.key && onKeyChange) {
        onKeyChange(option.key as any as T)
      }
    },
    [onChange, onKeyChange],
  )

  return (
    <Dropdown
      useComboBoxAsMenuWidth
      styles={{
        root: { minWidth: '220px', i: { fontSize: '10px', fontWeight: 600 } },
        title: { borderColor: NeutralColors.gray110 },
      }}
      onRenderTitle={onRenderDropdownTitle}
      onRenderPlaceholder={onRenderPlaceholder}
      onChange={onDropdownChange}
      {...restProps}
    />
  )
}
