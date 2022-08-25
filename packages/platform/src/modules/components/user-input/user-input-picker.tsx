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

import { PlusCircleOutlined } from '@ant-design/icons'
import { Callout, Stack, TextField } from '@fluentui/react'
import { FC, useCallback, useRef, KeyboardEvent } from 'react'

import { useToggleState } from '@perfsee/components'
import { isValidEmail } from '@perfsee/components/form/validators'

interface Props {
  onPick: (email: string) => void
}

export const UserInputPicker: FC<Props> = ({ onPick }) => {
  const [isOpen, open, close] = useToggleState(false)
  const iconRef = useRef<HTMLSpanElement>(null)

  const onEmailInput = useCallback(
    (email: string) => {
      close()
      onPick(email)
    },
    [close, onPick],
  )

  return (
    <>
      <PlusCircleOutlined ref={iconRef} onClick={open} />
      {isOpen && (
        <Callout onDismiss={close} target={iconRef} styles={{ calloutMain: { padding: 6 } }}>
          <Input onChange={onEmailInput} />
        </Callout>
      )}
    </>
  )
}

const getUserInputError = (input: string) => {
  if (input.length === 0) {
    return 'Required'
  }

  if (!isValidEmail(input)) {
    return 'Invalid email'
  }
}

export const Input = ({ onChange }: { onChange: (email: string) => void }) => {
  const onInputChange = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        const val = event.currentTarget.value
        if (!getUserInputError(val)) {
          onChange(val)
          event.currentTarget.value = ''
        }
      }
    },
    [onChange],
  )

  return (
    <Stack horizontal verticalAlign="start" tokens={{ childrenGap: 8 }}>
      <TextField placeholder="email address" onGetErrorMessage={getUserInputError} onKeyUp={onInputChange} autoFocus />
    </Stack>
  )
}
