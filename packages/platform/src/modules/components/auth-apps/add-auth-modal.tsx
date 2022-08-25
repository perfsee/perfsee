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

import { PlusOutlined } from '@ant-design/icons'
import { Checkbox, DefaultButton, Dialog, DialogFooter, DialogType, PrimaryButton } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { FC, memo, useCallback, useRef, useState } from 'react'

import { Pagination, useToggleState } from '@perfsee/components'
import { Permission } from '@perfsee/schema'

import { Application, AuthAppsModule } from './module'
import { AddAppWrap, AppList, AppWrap, Avatar, Content, PermissionCheckWrap, Title } from './styled'

const modelProps = {
  isBlocking: false,
  styles: { main: { minWidth: 800, maxWidth: 800 } },
}

const dialogContentProps = {
  type: DialogType.largeHeader,
  title: 'Auth new app',
}

type Props = {
  projectId: string
}

export const AddAuthModal: FC<Props> = memo(({ projectId }) => {
  const [{ applications }, dispatcher] = useModule(AuthAppsModule)
  const [modalVisible, showModal, hideModal] = useToggleState(false)
  const [page, setPage] = useState(0)
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const permissionsCheckRef = useRef({} as Record<Permission, boolean>)

  const onChangePage = useCallback((page: number) => {
    setPage(page)
  }, [])

  const onShowModal = useCallback(() => {
    dispatcher.getApplications({ first: 10, skip: page * 10 })

    showModal()
  }, [dispatcher, page, showModal])

  const onSelectApp = useCallback(
    (app: Application) => () => {
      setSelectedApp(app)
    },
    [],
  )

  const onChangeCheckbox = useCallback(
    (permission: Permission) => (_: any, checked?: boolean) => {
      permissionsCheckRef.current[permission] = checked ?? false
    },
    [],
  )

  const onCancelSelect = useCallback(() => {
    setSelectedApp(null)
  }, [])

  const onAddApp = useCallback(() => {
    if (selectedApp) {
      const permissions = Object.entries(permissionsCheckRef.current)
        .filter(([, value]) => value)
        .map(([key]) => key as Permission)

      dispatcher.authNewApplications({
        projectId,
        permissions,
        applicationId: selectedApp.id,
      })
    }

    hideModal()
    permissionsCheckRef.current = {} as Record<Permission, boolean>
    setSelectedApp(null)
  }, [dispatcher, hideModal, projectId, selectedApp])

  return (
    <>
      <AddAppWrap onClick={onShowModal}>
        <PlusOutlined />
      </AddAppWrap>
      <Dialog
        hidden={!modalVisible}
        modalProps={modelProps}
        minWidth={600}
        maxWidth={600}
        dialogContentProps={dialogContentProps}
        onDismiss={hideModal}
      >
        {selectedApp ? (
          <>
            <AppList>
              <AppWrap appId={selectedApp.id}>
                <Avatar appId={selectedApp.id}>{selectedApp.username[0].toUpperCase()}</Avatar>
                <Content>
                  <Title>{selectedApp.username}</Title>
                </Content>
              </AppWrap>
              <PermissionCheckWrap>
                {[Permission.Read, Permission.Admin].map((permission) => (
                  <Checkbox
                    key={permission}
                    label={permission}
                    defaultChecked={false}
                    onChange={onChangeCheckbox(permission)}
                  />
                ))}
              </PermissionCheckWrap>
            </AppList>
            <DialogFooter>
              <PrimaryButton onClick={onAddApp} text="Save" />
              <DefaultButton onClick={onCancelSelect} text="Cancel" />
            </DialogFooter>
          </>
        ) : (
          <>
            <AppList>
              {applications.items.map((app) => (
                <AppWrap key={app.id} appId={app.id} selectable={true} onClick={onSelectApp(app)}>
                  <Avatar appId={app.id}>{app.username[0].toUpperCase()}</Avatar>
                  <Content>
                    <Title>{app.username}</Title>
                  </Content>
                </AppWrap>
              ))}
            </AppList>
            <Pagination total={applications.totalCount} pageSize={10} onChange={onChangePage} />
          </>
        )}
      </Dialog>
    </>
  )
})
