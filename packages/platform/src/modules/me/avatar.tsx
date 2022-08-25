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

import { Persona, PersonaSize } from '@fluentui/react'
import { useModuleState } from '@sigi/react'

import { adjustOSSImgSize } from '@perfsee/platform/common'

import { UserModule } from '../../modules/shared'

export const UserAvatar = () => {
  const { user } = useModuleState(UserModule)

  if (user) {
    return (
      <Persona
        size={PersonaSize.size32}
        imageAlt={user.username}
        imageUrl={user.avatarUrl ? adjustOSSImgSize(user.avatarUrl, { size: 32 }) : void 0}
        hidePersonaDetails={true}
      />
    )
  }

  return null
}
