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
import { FC, useCallback } from 'react'

import { SharedColors } from '@perfsee/dls'
import { SearchedUser } from '@perfsee/platform/modules/shared'

import { UserInfo } from './types'
import { UserSearchPicker } from './user-search-picker'
import { CloseableUserTag } from './user-tag'

interface UserSelectProps {
  users: UserInfo[]
  onChange: (users: UserInfo[]) => void
  label: string
  required?: boolean
}

export const UserSelect: FC<UserSelectProps> = ({ users, onChange, label, required }) => {
  const handleRemove = useCallback(
    (removedUser: string) => {
      onChange(users.filter(({ username }) => username !== removedUser))
    },
    [onChange, users],
  )

  const handleAdd = useCallback(
    (searchUser: SearchedUser) => {
      onChange([...users, searchUser])
    },
    [onChange, users],
  )

  return (
    <Stack>
      <Label required={required}>{label}</Label>
      <Stack horizontal={true} tokens={{ childrenGap: 6 }} verticalAlign="center" wrap={true}>
        {users.map(({ email, avatarUrl }) => (
          <CloseableUserTag key={email} email={email} avatarUrl={avatarUrl} onClose={handleRemove} />
        ))}
        <UserSearchPicker onPick={handleAdd} />
      </Stack>
      {users.length === 0 && required && <Text styles={{ root: { color: SharedColors.red20 } }}>Required</Text>}
    </Stack>
  )
}
