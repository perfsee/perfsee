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

import { Dialog, PrimaryButton, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { FC, memo, useEffect } from 'react'
import { Redirect } from 'react-router'

import { useToggleState } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import { CreateProjectModule } from '../../shared'

import { CreateProjectForm } from './create-project-form'

export const CreateProjectAction: FC = memo(() => {
  const [{ createdProject }, dispatcher] = useModule(CreateProjectModule)
  const [dialogVisible, openDialog, closeDialog] = useToggleState()

  useEffect(() => dispatcher.reset, [dispatcher])

  if (createdProject) {
    return (
      <Redirect
        to={pathFactory.project.home({
          projectId: createdProject.id,
        })}
      />
    )
  }

  return (
    <Stack>
      <PrimaryButton text="Create Project" onClick={openDialog} />
      <Dialog
        minWidth="600px"
        hidden={!dialogVisible}
        onDismiss={closeDialog}
        dialogContentProps={{ title: 'Create Project' }}
        modalProps={{ isBlocking: true }}
      >
        <CreateProjectForm onClose={closeDialog} />
      </Dialog>
    </Stack>
  )
})
