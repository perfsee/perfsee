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
import styled from '@emotion/styled'
import { Callout, Persona, PersonaSize, SearchBox, Spinner, SpinnerSize, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { FC, useCallback, useRef } from 'react'

import { useToggleState } from '@perfsee/components'
import { NeutralColors } from '@perfsee/dls'
import { SearchedUser, UserSearchModule } from '@perfsee/platform/modules/shared'

interface Props {
  onPick: (user: SearchedUser) => void
}

export const UserSearchPicker: FC<Props> = ({ onPick: onSelect }) => {
  const [isOpen, open, close] = useToggleState(false)
  const [{ users, searching }, { search }] = useModule(UserSearchModule)
  const iconRef = useRef<HTMLSpanElement>(null)

  const onClickUser = useCallback(
    (user: SearchedUser) => {
      close()
      onSelect(user)
    },
    [close, onSelect],
  )

  return (
    <>
      <PlusCircleOutlined ref={iconRef} onClick={open} />
      {isOpen && (
        <Callout onDismiss={close} target={iconRef} styles={{ calloutMain: { padding: 6 } }}>
          <SearchBox
            onSearch={search}
            styles={{ root: { minWidth: 300, marginBottom: 4 } }}
            placeholder="username or email"
            autoFocus={true}
          />
          {searching ? (
            <Spinner size={SpinnerSize.medium} />
          ) : (
            <Stack>
              {users.map((user) => (
                <UserRow key={user.username} user={user} onClick={onClickUser} />
              ))}
            </Stack>
          )}
        </Callout>
      )}
    </>
  )
}

const UserWrapper = styled.div({
  padding: 6,
  cursor: 'pointer',
  ':hover': { background: NeutralColors.gray20 },
})

const UserRow = ({ user, onClick }: { user: SearchedUser; onClick: (user: SearchedUser) => void }) => {
  const click = useCallback(() => {
    onClick(user)
  }, [user, onClick])

  return (
    <UserWrapper onClick={click}>
      <Persona
        size={PersonaSize.size40}
        imageUrl={user.avatarUrl ?? void 0}
        text={user.username}
        secondaryText={user.username}
      />
    </UserWrapper>
  )
}
