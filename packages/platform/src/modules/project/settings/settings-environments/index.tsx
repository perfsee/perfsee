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

import { GlobalOutlined, StopOutlined } from '@ant-design/icons'
import { PrimaryButton, Stack } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useMemo, useRef, useState } from 'react'

import { SharedColors } from '@perfsee/dls'

import { DeleteProgress, EnvSchema, PropertyModule } from '../../../shared'
import { SettingCards } from '../cards'
import { ButtonOperators, DeleteContent, SettingDialogs, CountBlock, DialogVisible } from '../settings-common-comp'
import {
  PropertyCard,
  PropertyCardTop,
  PropertyIcon,
  PropertyInfos,
  PropertyName,
  StyledDesc,
  PropertyId,
} from '../style'

import { EnvEditForm } from './env-edit-form'

export const SettingsEnvironments = () => {
  const [{ environments, deleteProgress }, dispatcher] = useModule(PropertyModule, {
    selector: (state) => ({ environments: state.environments, deleteProgress: state.deleteProgress.env }),
    dependencies: [],
  })

  const [env, setEnv] = useState<EnvSchema | undefined>() // for record edit or delete env
  const [visible, setDialogVisible] = useState<DialogVisible>(DialogVisible.Off)
  const [isTable, setIsTable] = useState<boolean>(true)

  const formRef = useRef<{
    getTablePayload: () => EnvSchema | undefined
    getJsonPayload: () => EnvSchema | undefined
  }>()

  const onClickCreate = useCallback(() => {
    setEnv(undefined)
    setDialogVisible(DialogVisible.Edit)
    setIsTable(true)
  }, [])

  const openEditModal = useCallback((e?: EnvSchema) => {
    setEnv(e)
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const openDeleteModal = useCallback((e: EnvSchema) => {
    setEnv(e)
    setDialogVisible(DialogVisible.Delete)
  }, [])

  const closeModal = useCallback(() => {
    setDialogVisible(DialogVisible.Off)
  }, [])

  const closeDeleteModal = useCallback(() => {
    closeModal()
    dispatcher.setDeleteProgress({ type: 'env', progress: DeleteProgress.None })
  }, [closeModal, dispatcher])

  const onDisableEnv = useCallback(
    (e: EnvSchema) => {
      dispatcher.updateOrCreateEnv({ ...e, disable: true })
    },
    [dispatcher],
  )

  const onRestoreEnv = useCallback(
    (e: EnvSchema) => {
      dispatcher.updateOrCreateEnv({ ...e, disable: false })
    },
    [dispatcher],
  )

  const onUpdateEnv = useCallback(
    (payload: Partial<EnvSchema>) => {
      dispatcher.updateOrCreateEnv(payload)
      closeModal()
    },
    [dispatcher, closeModal],
  )

  const onDelete = useCallback(() => {
    env && dispatcher.deleteEnvironment(env.id)
  }, [dispatcher, env])

  const onRenderCell = useCallback(
    (item?: EnvSchema) => {
      if (!item) return null
      const headerCount = item.headers.length
      const cookieCount = item.cookies.length

      return (
        <PropertyCard>
          <PropertyCardTop style={item.disable ? { color: SharedColors.gray10 } : undefined}>
            <PropertyIcon disable={!!item.disable}>{item.disable ? <StopOutlined /> : <GlobalOutlined />}</PropertyIcon>
            <PropertyInfos>
              <Stack horizontal horizontalAlign="space-between">
                <PropertyName>{item.name}</PropertyName>
                <PropertyId>#{item.id}</PropertyId>
              </Stack>
              <div>
                <CountBlock title="cookie" count={cookieCount} />
                <CountBlock title="header" count={headerCount} />
                <StyledDesc size="12px">{item.zone}</StyledDesc>
              </div>
            </PropertyInfos>
          </PropertyCardTop>
          <ButtonOperators
            item={item}
            showDisableButton={!item.disable}
            showRestoreButton={item.disable}
            clickDeleteButton={openDeleteModal}
            clickEditButton={openEditModal}
            clickDisableButton={onDisableEnv}
            clickRestoreButton={onRestoreEnv}
          />
        </PropertyCard>
      )
    },
    [onDisableEnv, onRestoreEnv, openDeleteModal, openEditModal],
  )

  const onToggleTable = useCallback(() => {
    setIsTable((isTable) => {
      const payload = !isTable ? formRef.current?.getJsonPayload() : formRef.current?.getTablePayload()
      setEnv(payload)

      return !isTable
    })
  }, [])

  const settingDialog = useMemo(() => {
    const editContent = (
      <EnvEditForm ref={formRef} isTable={isTable} defaultEnv={env} onSubmit={onUpdateEnv} closeModal={closeModal} />
    )
    const deleteContent = (
      <DeleteContent
        type="env"
        name={env?.name ?? ''}
        progress={deleteProgress}
        onDelete={onDelete}
        closeModal={closeDeleteModal}
      />
    )
    return (
      <SettingDialogs
        type="Environment"
        onCloseDialog={closeModal}
        editContent={editContent}
        isTable={isTable}
        onToggleTable={onToggleTable}
        visible={visible}
        deleteContent={deleteContent}
        isCreate={!env}
      />
    )
  }, [isTable, env, onUpdateEnv, closeModal, deleteProgress, onDelete, closeDeleteModal, onToggleTable, visible])

  return (
    <div>
      <Stack horizontalAlign="end">
        <PrimaryButton onClick={onClickCreate}>Create Environment</PrimaryButton>
      </Stack>
      <SettingCards items={environments} onRenderCell={onRenderCell} />
      {settingDialog}
    </div>
  )
}
