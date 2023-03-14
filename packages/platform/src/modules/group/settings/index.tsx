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

import { Stack, Label, Spinner, NeutralColors } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useEffect } from 'react'
import { useParams } from 'react-router'

import { BodyContainer } from '@perfsee/components'
import { Permission } from '@perfsee/shared'
import { RouteTypes } from '@perfsee/shared/routes'

import { DumbSettingPermission } from '../../project/settings/settings-permission'
import { GroupModule } from '../../shared/group.module'

import { AddProjects } from './add-projects'
import { DangerZone } from './danger-zone'
import { GroupPermissionSettingsModule, User } from './module'

export function Settings() {
  const { groupId } = useParams<RouteTypes['group']['settings']>()

  const [{ group, loading }, { updateGroup }] = useModule(GroupModule)
  const [{ users }, dispatcher] = useModule(GroupPermissionSettingsModule)

  useEffect(() => {
    if (groupId) {
      dispatcher.getGroupAuthorizedUsers(groupId)
    }
  }, [dispatcher, groupId])

  const onAddUser = useCallback(
    (newUserEmail: string, newPermission: Permission) => {
      dispatcher.saveGroupOwners({ email: newUserEmail, permission: newPermission, isAdd: true })
    },
    [dispatcher],
  )

  const onDeleteUser = useCallback(
    (user: User) => {
      dispatcher.saveGroupOwners({ email: user.email, permission: user.permission, isAdd: false })
    },
    [dispatcher],
  )

  const onAddProject = useCallback(
    (id: string) => {
      if (group) {
        updateGroup({ groupId: group.id, projectId: id, isAdd: true })
      }
    },
    [group, updateGroup],
  )

  const onDeleteProject = useCallback(
    (id: string) => {
      if (group) {
        updateGroup({ groupId: group.id, projectId: id, isAdd: false })
      }
    },
    [group, updateGroup],
  )

  if (loading || !group) {
    return (
      <BodyContainer>
        <Spinner />
      </BodyContainer>
    )
  }

  return (
    <BodyContainer>
      <Stack
        tokens={{ childrenGap: 12 }}
        styles={{ root: { backgroundColor: NeutralColors.white, padding: '4px 20px' } }}
      >
        <Stack.Item>
          <Label>ID</Label>
          {group.id}
        </Stack.Item>
        <Stack.Item>
          <Label>Projects</Label>
          <AddProjects projects={group.projects} onAddProject={onAddProject} onDeleteProject={onDeleteProject} />
        </Stack.Item>
        <Stack.Item>
          <Label>Users</Label>
          <DumbSettingPermission users={users} onAddUser={onAddUser} onDeleteUser={onDeleteUser} />
        </Stack.Item>
        <Stack.Item>
          <Label>Danger Zone</Label>
          <DangerZone />
        </Stack.Item>
      </Stack>
    </BodyContainer>
  )
}
