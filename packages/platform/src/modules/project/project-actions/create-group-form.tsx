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

import { DialogFooter, PrimaryButton, DefaultButton, Stack, TextField } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { FC, memo, useCallback, useState } from 'react'

import { Form } from '@perfsee/components'

import { SearchProjectsSelect } from '../../group/components'
import { CreateGroupModule } from '../../shared'

interface CreateGroupFormProps {
  onClose: () => void
}

const loadingIconProps = { iconName: 'loading' }
const PROJECT_LIMIT = 12

export const CreateGroupForm: FC<CreateGroupFormProps> = memo(({ onClose }) => {
  const [id, setGroupId] = useState<string | undefined>()
  const [selectedProjects, selectProjects] = useState<string[]>([])
  const [{ creating, idVerifying, idVerification }, { createGroup, verifyId }] = useModule(CreateGroupModule)

  const submitDisabled =
    selectedProjects.length < 1 || idVerifying || !idVerification?.ok || selectedProjects.length > PROJECT_LIMIT
  const handleSubmit = useCallback(() => {
    if (!id) {
      return
    }

    if (selectedProjects.length > PROJECT_LIMIT) {
      return
    }

    createGroup({
      id,
      projectIds: selectedProjects,
    })
  }, [id, createGroup, selectedProjects])

  const onIdChange = useCallback(
    (_e: any, value?: string) => {
      const id = value?.trim() || ''
      verifyId(id)
      setGroupId(id)
    },
    [verifyId],
  )

  return (
    <Form loading={creating}>
      <TextField
        placeholder="Uniq id for your group. e.g: perfsee_sample"
        errorMessage={idVerifying ? undefined : idVerification?.error || undefined}
        onChange={onIdChange}
        iconProps={idVerifying ? loadingIconProps : undefined}
        label="Id"
        required
      />
      <SearchProjectsSelect
        multiSelect={true}
        placeholder={`Need less than ${PROJECT_LIMIT} projects`}
        selectedProjects={selectedProjects}
        onSelect={selectProjects}
      />
      <Stack.Item>
        <DialogFooter>
          <PrimaryButton onClick={handleSubmit} text="OK" disabled={submitDisabled} />
          <DefaultButton onClick={onClose} text="Cancel" />
        </DialogFooter>
      </Stack.Item>
    </Form>
  )
})
