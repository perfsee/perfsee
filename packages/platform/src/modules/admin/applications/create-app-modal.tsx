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

import { DefaultButton, Dialog, DialogFooter, DialogType, Label, PrimaryButton, TextField } from '@fluentui/react'
import { useModule } from '@sigi/react'
import { useCallback, useMemo, useState } from 'react'

import { Form, useToggleState } from '@perfsee/components'

import { ApplicationsModule } from './module'

const modelProps = {
  isBlocking: false,
  styles: { main: { minWidth: 800, maxWidth: 800 } },
}

const dialogContentProps = {
  type: DialogType.largeHeader,
  title: 'Create new app',
}

export const CreateAppModal = () => {
  const [{ appToken }, { createApplication, setAppToken }] = useModule(ApplicationsModule)
  const [modalVisible, showModal, hideModal] = useToggleState(false)
  const [name, setName] = useState<string>('')

  const onCreateApp = useCallback(() => {
    if (!name) return

    createApplication({
      name,
    })
    hideModal()
  }, [createApplication, hideModal, name])

  const onChangeName = useCallback((_: any, newValue?: string) => {
    setName(newValue ?? '')
  }, [])

  const clearToken = useCallback(() => {
    setAppToken(null)

    setName('')
  }, [setAppToken])

  const disabled = useMemo(() => !name?.trim(), [name])

  return (
    <>
      <PrimaryButton onClick={showModal}>Create new app</PrimaryButton>
      <Dialog
        hidden={!modalVisible}
        minWidth="600px"
        modalProps={modelProps}
        dialogContentProps={dialogContentProps}
        onDismiss={hideModal}
      >
        <Form>
          <Label required={true}>Name</Label>
          <TextField onChange={onChangeName} />
        </Form>
        <DialogFooter>
          <PrimaryButton onClick={onCreateApp} disabled={disabled} text="Save" />
          <DefaultButton onClick={hideModal} text="Cancel" />
        </DialogFooter>
      </Dialog>
      <Dialog
        minWidth="600px"
        hidden={!appToken}
        modalProps={{ isBlocking: true }}
        dialogContentProps={{ type: DialogType.largeHeader, title: 'App token' }}
      >
        <p>{appToken}</p>
        <DialogFooter>
          <PrimaryButton onClick={clearToken} text="OK" />
        </DialogFooter>
      </Dialog>
    </>
  )
}
