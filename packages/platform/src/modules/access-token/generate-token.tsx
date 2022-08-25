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

import { DefaultButton, Dialog, DialogFooter, DialogType, PrimaryButton, Stack, TextField } from '@fluentui/react'
import { FC, useCallback, useMemo, useState } from 'react'

import { useToggleState } from '@perfsee/components'
import { notify } from '@perfsee/platform/common'

type Props = {
  generateResult: string | null
  onGenerate: (name: string) => void
  onHideResult: () => void
}

export const GenerateToken: FC<Props> = ({ generateResult, onGenerate, onHideResult }) => {
  const [dialogVisible, showDialog, hideDialog] = useToggleState(false)
  const [nameInput, setNameInput] = useState('')

  const onChangeName = useCallback((_e: any, newValue?: string) => {
    setNameInput(newValue ?? '')
  }, [])

  const confirmDisabled = useMemo(() => {
    return !nameInput || !nameInput.trim()
  }, [nameInput])

  const onCreate = useCallback(() => {
    onGenerate(nameInput)
    hideDialog()
    setNameInput('')
  }, [hideDialog, nameInput, onGenerate])

  const onCopyToken = useCallback(() => {
    navigator.clipboard
      .writeText(generateResult ?? '')
      .then(() => {
        notify.success({ content: 'Copied', duration: 3000 })
      })
      .catch(() => {
        notify.error({ content: 'Copy failed, please copy it manually.' })
      })
  }, [generateResult])

  return (
    <>
      <PrimaryButton onClick={showDialog}>Generate new token</PrimaryButton>
      <Dialog
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Generate new token',
        }}
        hidden={!dialogVisible}
        styles={{
          main: {
            'div&': {
              width: '400px',
              maxWidth: '400px',
            },
          },
        }}
        onDismiss={hideDialog}
      >
        <TextField label="name" required onChange={onChangeName} />
        <DialogFooter>
          <PrimaryButton disabled={confirmDisabled} onClick={onCreate}>
            Create
          </PrimaryButton>
          <DefaultButton onClick={hideDialog}>Cancel</DefaultButton>
        </DialogFooter>
      </Dialog>
      <Dialog
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Token',
          subText: 'This will display only ONCE! Please keep it safely.',
        }}
        modalProps={{ isBlocking: true }}
        styles={{
          main: {
            'div&': {
              maxWidth: '600px',
            },
          },
        }}
        hidden={!generateResult}
        onDismiss={onHideResult}
      >
        <Stack horizontal tokens={{ childrenGap: '12px' }}>
          <TextField disabled defaultValue={generateResult ?? ''} styles={{ root: { width: 400 } }} />
          <PrimaryButton onClick={onCopyToken}>Copy</PrimaryButton>
        </Stack>
        <DialogFooter>
          <DefaultButton onClick={onHideResult}>OK</DefaultButton>
        </DialogFooter>
      </Dialog>
    </>
  )
}
