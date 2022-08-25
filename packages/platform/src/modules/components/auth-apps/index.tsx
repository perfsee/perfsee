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

import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons'
import { Checkbox, Label, SharedColors, Stack, TooltipHost } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { fromPairs } from 'lodash'
import { FC, memo, useCallback, useEffect, useRef } from 'react'

import { useToggleState } from '@perfsee/components'
import { Permission } from '@perfsee/schema'

import { AddAuthModal } from './add-auth-modal'
import { AuthApplication, AuthAppsModule } from './module'
import {
  AppList,
  AppWrap,
  Avatar,
  Content,
  EditIcon,
  OperationItem,
  OperationWrap,
  PermissionSpan,
  PermissionCheckWrap,
  Title,
} from './styled'

type Props = {
  projectId: string
}

export const AuthApps: FC<Props> = memo(({ projectId }) => {
  const [{ authApps }, dispatcher] = useModule(AuthAppsModule)

  const onChangePermission = useCallback(
    (appId: number, permissions: Permission[]) => {
      dispatcher.updateAuthAppPermission({ projectId, appId, permissions })
    },
    [dispatcher, projectId],
  )

  const onDeletePermission = useCallback(
    (id: number) => {
      dispatcher.deleteAuthApplication({ projectId, appId: id })
    },
    [dispatcher, projectId],
  )

  useEffect(() => {
    dispatcher.getAuthorizedApps(projectId)
  }, [dispatcher, projectId])

  return (
    <Stack>
      <Label>Authorized Applications</Label>
      <AppList>
        {authApps.map((app) => (
          <Application
            key={app.app.id}
            app={app}
            onChangePermission={onChangePermission}
            onDeletePermission={onDeletePermission}
          />
        ))}
        <AddAuthModal projectId={projectId} />
      </AppList>
    </Stack>
  )
})

type AppItemProps = {
  app: AuthApplication
  onChangePermission: (appId: number, permission: Permission[]) => void
  onDeletePermission: (appId: number) => void
}

const Application: FC<AppItemProps> = ({ app, onChangePermission, onDeletePermission }) => {
  const {
    permissions,
    app: { username, id: appId },
  } = app

  const [editMode, showEditMode, hideEditMode] = useToggleState(false)

  const updatedPermissionsRef = useRef({} as Record<Permission, boolean>)
  const permissionDisplay = permissions.join(', ')

  const onChangeCheckbox = useCallback(
    (permission: Permission) => (_: any, checked?: boolean) => {
      updatedPermissionsRef.current[permission] = checked ?? false
    },
    [],
  )

  const onSubmit = useCallback(() => {
    // ['Read', 'Admin'] => { Read: true, Admin: true }
    const rawPermissionsMap = fromPairs(permissions.map((p) => [p, true]))

    const result = Object.assign({}, rawPermissionsMap, updatedPermissionsRef.current)
    const updatedPermissions = Object.entries(result)
      .filter(([, value]) => value)
      .map(([key]) => key as Permission)

    onChangePermission(appId, updatedPermissions)
    hideEditMode()
  }, [appId, hideEditMode, onChangePermission, permissions])

  const onDelete = useCallback(() => {
    onDeletePermission(appId)
    hideEditMode()
  }, [appId, hideEditMode, onDeletePermission])

  if (editMode) {
    return (
      <AppWrap appId={appId}>
        <Content>
          <Title>{username}</Title>
          <PermissionCheckWrap>
            {[Permission.Read, Permission.Admin].map((permission) => (
              <Checkbox
                key={permission}
                label={permission + ''}
                defaultChecked={permissions.includes(permission)}
                onChange={onChangeCheckbox(permission)}
              />
            ))}
          </PermissionCheckWrap>
        </Content>
        <OperationWrap>
          <OperationItem color={SharedColors.greenCyan10} onClick={onSubmit}>
            <TooltipHost content="Save">
              <CheckOutlined />
            </TooltipHost>
          </OperationItem>
          <OperationItem color={SharedColors.gray10} onClick={hideEditMode}>
            <TooltipHost content="Cancel">
              <CloseOutlined />
            </TooltipHost>
          </OperationItem>
          <OperationItem color={SharedColors.red10} onClick={onDelete}>
            <TooltipHost content="Delete this auth application">
              <DeleteOutlined />
            </TooltipHost>
          </OperationItem>
        </OperationWrap>
      </AppWrap>
    )
  }

  return (
    <AppWrap appId={appId}>
      <Avatar appId={appId}>{username.slice(0, 1).toUpperCase()}</Avatar>
      <Content>
        <Title>{username}</Title>
        <PermissionSpan>
          {permissionDisplay || 'No Permission'}
          <EditIcon onClick={showEditMode}>
            <EditOutlined />
          </EditIcon>
        </PermissionSpan>
      </Content>
    </AppWrap>
  )
}
