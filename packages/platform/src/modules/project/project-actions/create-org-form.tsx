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
import { FC, memo, useCallback, useMemo, useState } from 'react'

import { Form, MultiSelector } from '@perfsee/components'

import { CreateOrganizationModule } from '../../shared'
import { ProjectsModule } from '../list.module'

interface CreateOrganizationFormProps {
  onClose: () => void
}

const loadingIconProps = { iconName: 'loading' }

export const CreateOrganizationForm: FC<CreateOrganizationFormProps> = memo(({ onClose }) => {
  const [{ projects }] = useModule(ProjectsModule) // todo(yying): search & 不和列表共用数据？

  const [id, setOrganizationId] = useState<string | undefined>()
  const [projectSlugs, setProjectSlugs] = useState<string[]>([])
  const [{ creating, idVerifying, idVerification }, { createOrganization, verifyId }] =
    useModule(CreateOrganizationModule)

  const submitDisabled = projectSlugs.length < 1 || idVerifying || !idVerification?.ok
  const handleSubmit = useCallback(() => {
    if (!id) {
      return
    }

    createOrganization({
      id,
      projectSlugs,
    })
  }, [id, createOrganization, projectSlugs])

  const onIdChange = useCallback(
    (_e: any, value?: string) => {
      const id = value?.trim() || ''
      verifyId(id)
      setOrganizationId(id)
    },
    [verifyId],
  )

  const onProjectsChange = useCallback((ids: string[]) => {
    setProjectSlugs(ids)
  }, [])

  const projectOptions = useMemo(() => {
    return projects.map((p) => {
      return {
        id: p.id,
        name: p.id,
      }
    })
  }, [projects])

  return (
    <Form loading={creating}>
      <TextField
        placeholder="Uniq id for your organization. e.g: perfsee_sample"
        errorMessage={idVerifying ? undefined : idVerification?.error || undefined}
        onChange={onIdChange}
        iconProps={idVerifying ? loadingIconProps : undefined}
        label="Id"
        required
      />
      <MultiSelector<string>
        options={projectOptions}
        ids={projectSlugs}
        onSelectChange={onProjectsChange}
        label="Projects"
        errorMessage="Required"
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
