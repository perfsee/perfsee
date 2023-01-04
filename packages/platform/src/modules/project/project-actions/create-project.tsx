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
import { FC, memo, useCallback, useEffect, useState } from 'react'
import { Redirect } from 'react-router'

import { pathFactory } from '@perfsee/shared/routes'

import { CreateOrganizationModule, CreateProjectModule } from '../../shared'

import { CreateOrganizationForm } from './create-org-form'
import { CreateProjectForm } from './create-project-form'

enum Visible {
  None,
  Project,
  Org,
}

export const CreateProjectAction: FC = memo(() => {
  const [{ createdProject }, dispatcher] = useModule(CreateProjectModule)
  const [{ createdOrganization }, orgDispatcher] = useModule(CreateOrganizationModule)
  const [dialogVisible, setVisible] = useState<Visible>(Visible.None)

  useEffect(() => dispatcher.reset, [dispatcher])
  useEffect(() => orgDispatcher.reset, [orgDispatcher])

  const openProjectDialog = useCallback(() => {
    setVisible(Visible.Project)
  }, [])

  const openOrgDialog = useCallback(() => {
    setVisible(Visible.Org)
  }, [])

  const closeDialog = useCallback(() => {
    setVisible(Visible.None)
  }, [])

  if (createdProject) {
    return (
      <Redirect
        to={pathFactory.project.home({
          projectId: createdProject.id,
        })}
      />
    )
  }

  if (createdOrganization) {
    return (
      <Redirect
        to={pathFactory.organization.home({
          organizationId: createdOrganization.id,
        })}
      />
    )
  }

  return (
    <Stack>
      <Stack horizontal tokens={{ childrenGap: 4 }}>
        <PrimaryButton text="Create Project" onClick={openProjectDialog} />
        <PrimaryButton text="Create Organization" onClick={openOrgDialog} />
      </Stack>

      <Dialog
        minWidth="600px"
        hidden={dialogVisible === Visible.None}
        onDismiss={closeDialog}
        dialogContentProps={{ title: `Create ${dialogVisible === Visible.Project ? 'Project' : 'Organization'}` }}
        modalProps={{ isBlocking: true }}
      >
        {dialogVisible === Visible.Project ? (
          <CreateProjectForm onClose={closeDialog} />
        ) : (
          <CreateOrganizationForm onClose={closeDialog} />
        )}
      </Dialog>
    </Stack>
  )
})
