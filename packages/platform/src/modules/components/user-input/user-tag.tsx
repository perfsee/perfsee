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

import { CloseCircleOutlined } from '@ant-design/icons'
import styled from '@emotion/styled'
import { Persona, PersonaSize } from '@fluentui/react'
import { FC, useCallback } from 'react'

import { Tag } from '@perfsee/components'

const TagWrapper = styled(Tag)({
  padding: '0 4px 0 0',
  height: '24px',
  borderRadius: '12px',
})

export const CloseableUserTag: FC<{
  email: string
  avatarUrl?: string | null
  onClose: (email: string) => void
  readonly?: boolean
}> = ({ email, avatarUrl, onClose, readonly }) => {
  const close = useCallback(() => {
    onClose(email)
  }, [email, onClose])

  return (
    <TagWrapper>
      <Persona size={PersonaSize.size24} text={email} imageUrl={avatarUrl ?? undefined} />
      {readonly ? null : <CloseCircleOutlined onClick={close} />}
    </TagWrapper>
  )
}
