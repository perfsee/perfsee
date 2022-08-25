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

import { Checkbox } from '@fluentui/react'
import { FC, useCallback } from 'react'

import { OptionWrapper } from './style'

interface SearchSelectOptionProps {
  multiSelect: boolean
  text: string
  id: string
  onChange: (option: { key: string; text: string; selected: boolean }) => void
  checked?: boolean
}

export const SearchSelectOption: FC<SearchSelectOptionProps> = ({ multiSelect, id, text, onChange, checked }) => {
  const handleChecked = useCallback(
    (_: any, checked?: boolean) => {
      onChange({ key: id, selected: !!checked, text })
    },
    [id, onChange, text],
  )

  const handleClickOption = useCallback(() => {
    onChange({ key: id, selected: true, text })
  }, [id, onChange, text])

  return (
    <OptionWrapper>
      {multiSelect ? (
        <Checkbox
          styles={{ label: { width: '100%', padding: '10px' } }}
          label={text}
          onChange={handleChecked}
          checked={checked}
        />
      ) : (
        <div style={{ padding: '10px' }} onClick={handleClickOption}>
          {text}
        </div>
      )}
    </OptionWrapper>
  )
}
