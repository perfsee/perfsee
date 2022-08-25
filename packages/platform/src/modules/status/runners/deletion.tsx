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

import { DefaultButton, Dialog, DialogFooter, DialogType, getTheme, TextField } from '@fluentui/react'
import { useDispatchers } from '@sigi/react'
import { useCallback, useState } from 'react'

import { ColorButton, useToggleState } from '@perfsee/components'

import { Runner, RunnersModule } from './module'

export function RunnerDeleteOperation({ runner }: { runner: Runner }) {
  const theme = getTheme()
  const dispatchers = useDispatchers(RunnersModule)
  const [dialogVisible, showDialog, hideDialog] = useToggleState(false)
  const [buttonDisabled, setButtonDisabled] = useState(true)

  const toggleActivation = useCallback(() => {
    hideDialog()
    dispatchers.deleteRunner(runner.id)
  }, [runner, hideDialog, dispatchers])

  const onInputChange = useCallback(
    (_: any, input: string | undefined) => {
      if (input === runner.id) {
        setButtonDisabled(false)
      }
    },
    [runner, setButtonDisabled],
  )

  const color = theme.palette.red

  return (
    <>
      <ColorButton color={color} onClick={showDialog}>
        Delete
      </ColorButton>
      <Dialog
        hidden={!dialogVisible}
        onDismiss={hideDialog}
        dialogContentProps={{
          type: DialogType.largeHeader,
          title: 'Confirming',
          styles: { content: { borderColor: color }, title: { color } },
        }}
      >
        <p style={{ wordBreak: 'break-all' }}>
          You are going to <span style={{ color }}>DELETE</span> a registered runner. And this action can not be
          reverted.
        </p>
        <p>
          Input the id{' '}
          <code style={{ wordBreak: 'keep-all', background: theme.palette.neutralLight, padding: 4, borderRadius: 4 }}>
            {runner.id}
          </code>{' '}
          to continue
        </p>
        <TextField placeholder="runner id" onChange={onInputChange} spellCheck={false} />
        <DialogFooter>
          <ColorButton color={color} onClick={toggleActivation} disabled={buttonDisabled}>
            Delete
          </ColorButton>
          <DefaultButton onClick={hideDialog}>cancel</DefaultButton>
        </DialogFooter>
      </Dialog>
    </>
  )
}
