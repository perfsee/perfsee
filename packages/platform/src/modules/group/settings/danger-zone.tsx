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

import { getTheme, Spinner, SpinnerSize, TextField } from '@fluentui/react'
import { SharedColors } from '@fluentui/theme'
import { useModule } from '@sigi/react'
import { useState, useCallback } from 'react'
import { Redirect } from 'react-router'

import { useToggleState, ColorButton, ModalType, Modal } from '@perfsee/components'
import { pathFactory } from '@perfsee/shared/routes'

import {
  DangerContent,
  DangerDescription,
  ButtonInnerText,
  PublicModalContent,
} from '../../project/settings/settings-basic/style'
import { DeleteProgress } from '../../shared'
import { GroupModule } from '../../shared/group.module'

const DeleteGroup = () => {
  const theme = getTheme()
  const [text, setText] = useState<string>()
  const [{ group, deleteProgress }, dispatcher] = useModule(GroupModule)

  const [dialogVisible, showDialog, hideDialog] = useToggleState()

  const deleteGroup = useCallback(() => {
    if (group && text === group.id) {
      dispatcher.deleteGroup(group.id)
    }
  }, [dispatcher, group, text])

  const onChange = useCallback((_e: any, newValue?: string) => {
    setText(newValue)
  }, [])

  const onDismiss = useCallback(() => {
    if (deleteProgress !== DeleteProgress.Running) {
      hideDialog()
    }
  }, [deleteProgress, hideDialog])

  if (deleteProgress === DeleteProgress.Done) {
    return <Redirect to={pathFactory.home()} push={false} />
  }

  if (!group) {
    return null
  }

  const color = theme.palette.red

  return (
    <div>
      <DangerContent>
        <DangerDescription>
          <p>Delete this group</p>
          <span>It can not be restored</span>
        </DangerDescription>
        <ColorButton color={SharedColors.red10} onClick={showDialog}>
          <ButtonInnerText>Delete</ButtonInnerText>
        </ColorButton>
      </DangerContent>
      <Modal
        isOpen={dialogVisible}
        title="Delete Group"
        type={ModalType.Warning}
        confirmDisabled={text !== group.id}
        onClose={onDismiss}
        onConfirm={deleteGroup}
      >
        {deleteProgress === DeleteProgress.Running ? (
          <Spinner styles={{ root: { margin: '18px 0' } }} label="Deleting..." size={SpinnerSize.large} />
        ) : (
          <PublicModalContent>
            <p>
              To confirm, type <span style={{ color }}>{group?.id}</span>
            </p>
            <TextField styles={{ root: { marginTop: '4px' } }} onChange={onChange} />
          </PublicModalContent>
        )}
      </Modal>
    </div>
  )
}

export const DangerZone = () => {
  return <DeleteGroup />
}
