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

import { Stack, Label, Text } from '@fluentui/react'
import { uniq } from 'lodash'
import { FC, useCallback } from 'react'

import { SharedColors } from '@perfsee/dls'

import { UserInputPicker } from './user-input-picker'
import { CloseableUserTag } from './user-tag'

interface UserEmailsInputProps {
  emails: string[]
  onChange: (emails: string[]) => void
  label: string
  required?: boolean
}

export const UserEmailsInput: FC<UserEmailsInputProps> = ({ emails, onChange, label, required }) => {
  const handleRemove = useCallback(
    (removedEmail: string) => {
      onChange(emails.filter((email) => email !== removedEmail))
    },
    [onChange, emails],
  )

  const handleAdd = useCallback(
    (email: string) => {
      onChange(uniq([...emails, email]))
    },
    [onChange, emails],
  )

  return (
    <Stack>
      <Label required={required}>{label}</Label>
      <Stack horizontal={true} tokens={{ childrenGap: 6 }} verticalAlign="center" wrap={true}>
        {emails.map((email) => (
          <CloseableUserTag key={email} email={email} onClose={handleRemove} />
        ))}
        <UserInputPicker onPick={handleAdd} />
      </Stack>
      {emails.length === 0 && required && <Text styles={{ root: { color: SharedColors.red20 } }}>Required</Text>}
    </Stack>
  )
}
