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

import { Form, Select } from '@perfsee/components'
import { GitHost } from '@perfsee/schema'

import { CreateProjectModule } from '../../shared'

import { GitHostOptions } from './utils'

interface CreateProjectFormProps {
  onClose: () => void
}

const loadingIconProps = { iconName: 'loading' }

export const CreateProjectForm: FC<CreateProjectFormProps> = memo(({ onClose }) => {
  const [repoPathErrorMessage, setRepoPathErrorMessage] = useState<string | undefined>()
  const [projectPath, setProjectPath] = useState<string | undefined>()
  const [id, setProjectId] = useState<string | undefined>()
  const [host, setHost] = useState<GitHost>(GitHost.Github)
  const [{ creating, idVerifying, idVerification }, { createProject, verifyId }] = useModule(CreateProjectModule)

  const submitDisabled = !projectPath || idVerifying || !idVerification?.ok
  const handleSubmit = useCallback(() => {
    if (!projectPath) {
      return
    }
    const [namespace, name] = projectPath.split('/')
    if (!namespace || !name) {
      setRepoPathErrorMessage('Invalid path')
      return
    }

    if (!id) {
      setRepoPathErrorMessage('Invalid id')
      return
    }

    createProject({
      id,
      name,
      namespace,
      host,
      artifactBaselineBranch: 'master',
    })
  }, [projectPath, createProject, id, host])

  const onRepoPathChange = useCallback((_e: any, value?: string) => {
    setProjectPath(value)
  }, [])

  const onIdChange = useCallback(
    (_e: any, value?: string) => {
      const id = value?.trim() || ''
      verifyId(id)
      setProjectId(id)
    },
    [verifyId],
  )

  const onHostChange = useCallback((key?: GitHost) => {
    if (!key) {
      return
    }
    setHost(key)
  }, [])

  return (
    <Form loading={creating}>
      <Select label="Host" options={GitHostOptions} selectedKey={host} onKeyChange={onHostChange} />
      <TextField
        placeholder="namespace/name"
        errorMessage={repoPathErrorMessage}
        onChange={onRepoPathChange}
        label="Repo Path"
        required
      />
      <TextField
        placeholder="Uniq id for your project. e.g: perfsee_sample"
        errorMessage={idVerifying ? undefined : idVerification?.error || undefined}
        onChange={onIdChange}
        iconProps={idVerifying ? loadingIconProps : undefined}
        label="Id"
        required
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
