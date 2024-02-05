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

import { StopOutlined, DesktopOutlined } from '@ant-design/icons'
import { Stack, PrimaryButton } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useState, useMemo } from 'react'

import { SharedColors } from '@perfsee/dls'

import { DeleteProgress, ProfileSchema, PropertyModule } from '../../../shared'
import { SettingCards } from '../cards'
import { getConnectionTitleByKey, getDeviceTitleByKey } from '../helper'
import { ButtonOperators, DeleteContent, DialogVisible, SettingDialogs } from '../settings-common-comp'
import {
  StyledDesc,
  EllipsisText,
  PropertyCard,
  PropertyCardTop,
  PropertyName,
  PropertyIcon,
  PropertyInfos,
  PropertyDescription,
  PropertyId,
} from '../style'

import { ProfileForm } from './profile-edit-form'

export const SettingsProfiles = () => {
  const [{ connections, devices, profiles, deleteProgress }, dispatcher] = useModule(PropertyModule, {
    selector: (state) => ({
      connections: state.connections,
      devices: state.devices,
      profiles: state.profiles,
      deleteProgress: state.deleteProgress.profile,
    }),
    dependencies: [],
  })

  const [profile, setProfile] = useState<Partial<ProfileSchema>>({}) // for record edit or delete profile
  const [visible, setDialogVisible] = useState<DialogVisible>(DialogVisible.Off)

  const onCreateProfile = useCallback(() => {
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const openEditModal = useCallback((p: ProfileSchema) => {
    setProfile(p)
    setDialogVisible(DialogVisible.Edit)
  }, [])

  const openDeleteModal = useCallback((p: ProfileSchema) => {
    setProfile(p)
    setDialogVisible(DialogVisible.Delete)
  }, [])

  const closeModal = useCallback(() => {
    setDialogVisible(DialogVisible.Off)
  }, [])

  const closeDeleteModal = useCallback(() => {
    closeModal()
    dispatcher.setDeleteProgress({ type: 'profile', progress: DeleteProgress.None })
  }, [closeModal, dispatcher])

  const onDisableProfile = useCallback(
    (profile: ProfileSchema) => {
      dispatcher.updateOrCreateProfile({ ...profile, disable: true })
    },
    [dispatcher],
  )

  const onRestoreProfile = useCallback(
    (profile: ProfileSchema) => {
      dispatcher.updateOrCreateProfile({ ...profile, disable: false })
    },
    [dispatcher],
  )

  const onUpdateProfile = useCallback(
    (payload: Partial<ProfileSchema>) => {
      dispatcher.updateOrCreateProfile(payload)
      closeModal()
    },
    [dispatcher, closeModal],
  )

  const onDelete = useCallback(() => {
    profile.id && dispatcher.deleteProfile(profile.id)
  }, [dispatcher, profile])

  const onRenderCell = useCallback(
    (item?: ProfileSchema) => {
      if (!item) return null
      const bandWidthTitle = getConnectionTitleByKey(connections, item.bandWidth)
      const deviceTitle = getDeviceTitleByKey(devices, item.device)

      return (
        <PropertyCard>
          <EllipsisText>
            <PropertyCardTop style={item.disable ? { color: SharedColors.gray10 } : undefined}>
              <PropertyIcon disable={!!item.disable}>
                {item.disable ? <StopOutlined /> : <DesktopOutlined />}
              </PropertyIcon>
              <PropertyInfos>
                <Stack horizontal horizontalAlign="space-between">
                  <PropertyName>{item.name}</PropertyName>
                  <PropertyId>#{item.id}</PropertyId>{' '}
                </Stack>
                <PropertyDescription>
                  {<StyledDesc>{deviceTitle}</StyledDesc>}
                  {<StyledDesc>{bandWidthTitle}</StyledDesc>}
                </PropertyDescription>
              </PropertyInfos>
            </PropertyCardTop>
          </EllipsisText>
          <ButtonOperators
            item={item}
            clickDeleteButton={openDeleteModal}
            clickEditButton={openEditModal}
            clickDisableButton={onDisableProfile}
            clickRestoreButton={onRestoreProfile}
            showDisableButton={!item.disable}
            showRestoreButton={item.disable}
          />
        </PropertyCard>
      )
    },
    [connections, devices, openDeleteModal, openEditModal, onDisableProfile, onRestoreProfile],
  )

  const editContent = useMemo(() => {
    return <ProfileForm profile={profile} closeModal={closeModal} onSubmit={onUpdateProfile} />
  }, [closeModal, onUpdateProfile, profile])

  const deleteContent = useMemo(() => {
    return (
      <DeleteContent
        type="profile"
        name={profile?.name ?? ''}
        progress={deleteProgress}
        onDelete={onDelete}
        closeModal={closeDeleteModal}
      />
    )
  }, [closeDeleteModal, deleteProgress, onDelete, profile?.name])

  return (
    <div>
      <Stack horizontalAlign="end">
        <PrimaryButton color={SharedColors.green20} onClick={onCreateProfile}>
          Create Profile
        </PrimaryButton>
      </Stack>
      <SettingCards items={profiles} onRenderCell={onRenderCell} />
      <SettingDialogs
        type={'Profile'}
        onCloseDialog={closeModal}
        editContent={editContent}
        deleteContent={deleteContent}
        visible={visible}
        isCreate={!profile.id}
      />
    </div>
  )
}
