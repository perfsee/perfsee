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

import { IComboBoxOption, ComboBox } from '@fluentui/react'
import { useCallback, useEffect, useMemo } from 'react'

export function EntrySelector({
  entry,
  entries,
  onChange,
}: {
  entry?: string
  entries?: string[]
  onChange: (entry: string, isUserSelect: boolean) => void
}) {
  const options = useMemo(() => entries?.map((branch) => ({ key: branch, text: branch })) ?? [], [entries])

  useEffect(() => {
    if (!entry && entries) {
      onChange(entries[0], false)
    }
  }, [entries, entry, onChange])

  const onSelect = useCallback(
    (_e?: any, option?: IComboBoxOption) => {
      if (option) {
        onChange(option.key as string, true)
      }
    },
    [onChange],
  )

  return (
    <ComboBox
      placeholder="Select a entry"
      // comboxBox with back to uncontrolled mode if undefined passed to `selectedKey`
      selectedKey={entry ?? null}
      options={options}
      allowFreeform={true}
      dropdownMaxWidth={300}
      onChange={onSelect}
    />
  )
}
