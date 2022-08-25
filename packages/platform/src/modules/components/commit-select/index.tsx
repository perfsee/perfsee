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

import { IComboBoxOption, ComboBox, IComboBoxStyles, NeutralColors } from '@fluentui/react'
import { useCallback, useMemo } from 'react'

const comboBoxStyles: Partial<IComboBoxStyles> = {
  root: { maxWidth: '300px', display: 'inline-block' },
  label: { display: 'inline-block', margin: '0 10px', color: NeutralColors.gray100 },
}

interface Props {
  value?: string
  items: string[]
  onChange: (value: string) => void
}
export function CommitHashSelector({ value, onChange, items }: Props) {
  const options = useMemo(() => {
    if (!items) {
      return []
    }

    return items.map((branch) => ({ key: branch, text: branch.slice(0, 8) }))
  }, [items])

  const onSelect = useCallback(
    (_e?: any, option?: IComboBoxOption) => {
      if (option) {
        onChange(option.key as string)
      }
    },
    [onChange],
  )

  return (
    <ComboBox
      styles={comboBoxStyles}
      label="commit: "
      selectedKey={value}
      options={options}
      autoComplete="on"
      dropdownMaxWidth={200}
      useComboBoxAsMenuWidth={true}
      allowFreeform={true}
      onChange={onSelect}
    />
  )
}
